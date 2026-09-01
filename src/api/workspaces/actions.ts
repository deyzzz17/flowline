'use server'

import 'server-only'

import { headers } from 'next/headers'
import { Pool } from 'pg'
import { auth } from '@/lib/auth'
import { ok, err } from '@/types/result'
import { getSession } from '@/lib/get-session'
import { getUserPlanLimits } from '@/lib/get-user-plan'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'
import { checkRateLimit } from '@/lib/rate-limit'
import { findUserByEmail, findUsersByIds, type ContactProfile } from '@/api/contacts/actions'

// Better Auth's org plugin ships 3 default roles: owner (auto-assigned to the
// creator, not invitable), admin, and member. We only ever invite as one of
// the latter two — "member" is displayed as "Editor" in the UI.
export type WorkspaceInviteRole = 'admin' | 'member'

const DEFAULT_ICON = 'Building2'
const DEFAULT_COLOR = '#8b5cf6'

export interface WorkspaceSummary {
  /** Better Auth organization id, or `null` for the Personal workspace. */
  id: string | null
  name: string
  isPersonal: boolean
  icon: string
  color: string
}

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

function parseMetadata(metadata: unknown): { icon: string; color: string } {
  const parsed: unknown =
    typeof metadata === 'string'
      ? (() => {
          try {
            return JSON.parse(metadata)
          } catch {
            return null
          }
        })()
      : metadata
  const data = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  const icon = typeof data.icon === 'string' ? data.icon : DEFAULT_ICON
  const color = typeof data.color === 'string' ? data.color : DEFAULT_COLOR
  return { icon, color }
}

export const listWorkspaces = async () => {
  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) return { docs: [] as WorkspaceSummary[], activeId: null as string | null }

  const orgs = await auth.api.listOrganizations({ headers: await headers() })

  const docs: WorkspaceSummary[] = [
    { id: null, name: 'Personal', isPersonal: true, icon: 'User', color: '#8b5cf6' },
    ...orgs.map((o) => ({
      id: o.id,
      name: o.name,
      isPersonal: false,
      ...parseMetadata(o.metadata),
    })),
  ]

  return { docs, activeId: session.session.activeOrganizationId ?? null }
}

// Only organizations this user OWNS count against their plan's workspace limit —
// being invited into someone else's workspace shouldn't use up your own quota.
async function countOwnedWorkspaces(userId: string): Promise<number> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM member WHERE "userId" = $1 AND role = 'owner'`,
      [userId],
    )
    return result.rows[0]?.count ?? 0
  } finally {
    await pool.end()
  }
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace'
  )
}

export interface CreateWorkspaceInvite {
  email: string
  role: WorkspaceInviteRole
}

export interface CreateWorkspaceInput {
  name: string
  icon: string
  color: string
  invites?: CreateWorkspaceInvite[]
}

export const createWorkspace = async (input: CreateWorkspaceInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const trimmed = input.name.trim()
    if (!trimmed) return err('Name is required')

    const { plan, limits } = await getUserPlanLimits()
    const ownedCount = await countOwnedWorkspaces(userId)
    if (isAtLimit(ownedCount, limits.workspaces)) {
      return err(
        isPlanUnlimited(plan, 'workspaces')
          ? SAFETY_CAP_ERRORS.WORKSPACES_CAP
          : LIMIT_ERRORS.WORKSPACES_LIMIT,
      )
    }

    const slug = `${slugify(trimmed)}-${Math.random().toString(36).slice(2, 8)}`
    const requestHeaders = await headers()

    const org = await auth.api.createOrganization({
      headers: requestHeaders,
      body: {
        name: trimmed,
        slug,
        metadata: { icon: input.icon || DEFAULT_ICON, color: input.color || DEFAULT_COLOR },
      },
    })

    if (!org) return err('Error while creating the workspace')

    // Invite failures (rate limit, duplicate, etc.) don't roll back the
    // workspace itself — they're reported back so the UI can inform the user
    // which invites, if any, didn't go through.
    const failedInvites: string[] = []
    for (const invite of input.invites ?? []) {
      try {
        await auth.api.createInvitation({
          headers: requestHeaders,
          body: { organizationId: org.id, email: invite.email, role: invite.role },
        })
      } catch {
        failedInvites.push(invite.email)
      }
    }

    return ok({
      workspace: {
        id: org.id,
        name: org.name,
        isPersonal: false,
        icon: input.icon || DEFAULT_ICON,
        color: input.color || DEFAULT_COLOR,
      } as WorkspaceSummary,
      failedInvites,
    })
  } catch {
    return err('Error while creating the workspace')
  }
}

export const switchWorkspace = async (workspaceId: string | null) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: workspaceId },
    })

    return ok(true)
  } catch {
    return err('Error while switching workspace')
  }
}

export const updateWorkspaceName = async (workspaceId: string, name: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const trimmed = name.trim()
    if (!trimmed) return err('Name is required')

    await auth.api.updateOrganization({
      headers: await headers(),
      body: { organizationId: workspaceId, data: { name: trimmed } },
    })

    return ok(true)
  } catch {
    return err('Error while renaming the workspace')
  }
}

export const deleteWorkspace = async (workspaceId: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    await auth.api.deleteOrganization({
      headers: await headers(),
      body: { organizationId: workspaceId },
    })

    return ok(true)
  } catch {
    return err('Error while deleting the workspace')
  }
}

export interface WorkspaceMember {
  id: string
  userId: string
  role: string
  name: string
  email: string
  image: string | null
  nickname: string | null
}

// Personal has no members (it's not an organization) — callers should only
// use this for a real (non-Personal) active workspace.
export const listWorkspaceMembers = async () => {
  const session = await getSession()
  const workspaceId = session?.session.activeOrganizationId
  if (!workspaceId) return { docs: [] as WorkspaceMember[] }

  const { members } = await auth.api.listMembers({
    headers: await headers(),
    query: { organizationId: workspaceId },
  })

  const docs: WorkspaceMember[] = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image ?? null,
    nickname: m.nickname ?? null,
  }))

  return { docs }
}

// Adding, changing roles, and removing all happen from the Members page.
// Better Auth's own permission checks already implement exactly the model
// requested: member:['update'|'delete'] is granted to both owner and admin
// by default (but NOT the base "member"/Editor role), and
// updateMemberRole's own internal logic additionally refuses to let anyone
// but an owner touch a member who IS an owner, or promote someone TO owner.
// We don't duplicate that logic here — just surface whatever error it throws.
export const inviteWorkspaceMember = async (email: string, role: WorkspaceInviteRole) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const session = await getSession()
    const workspaceId = session?.session.activeOrganizationId
    if (!workspaceId) return err('No active workspace')

    await auth.api.createInvitation({
      headers: await headers(),
      body: { organizationId: workspaceId, email: email.trim(), role },
    })

    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error inviting member'
    return err(message)
  }
}

export const updateWorkspaceMemberRole = async (memberId: string, role: WorkspaceInviteRole) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    await auth.api.updateMemberRole({
      headers: await headers(),
      body: { memberId, role },
    })

    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error updating member role'
    return err(message)
  }
}

export const removeWorkspaceMember = async (memberId: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    await auth.api.removeMember({
      headers: await headers(),
      body: { memberIdOrEmail: memberId },
    })

    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error removing member'
    return err(message)
  }
}

// The one member-editing action Better Auth has no endpoint for at all — a
// per-workspace nickname is our own addition (additionalFields on `member`).
// Anyone can rename themselves; only the owner can rename someone else.
export const updateMemberNickname = async (memberId: string, nickname: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const session = await getSession()
    const workspaceId = session?.session.activeOrganizationId
    if (!workspaceId) return err('No active workspace')

    const trimmed = nickname.trim()
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
      const targetResult = await pool.query(
        `SELECT "userId" FROM member WHERE id = $1 AND "organizationId" = $2`,
        [memberId, workspaceId],
      )
      const targetUserId = targetResult.rows[0]?.userId
      if (!targetUserId) return err('Member not found')

      if (targetUserId !== userId) {
        const callerResult = await pool.query(
          `SELECT role FROM member WHERE "organizationId" = $1 AND "userId" = $2`,
          [workspaceId, userId],
        )
        if (callerResult.rows[0]?.role !== 'owner') return err('Not authorized')
      }

      await pool.query(`UPDATE member SET nickname = $1 WHERE id = $2`, [trimmed || null, memberId])
    } finally {
      await pool.end()
    }

    return ok(true)
  } catch {
    return err('Error updating name')
  }
}

// Search for a registered user by email to invite to a workspace — not
// restricted to contacts, unlike list sharing: workspaces are for teams,
// which may include people you haven't connected with personally.
export const searchUserForWorkspaceInvite = async (
  email: string,
): Promise<{ ok: true; value: ContactProfile | null } | { ok: false; error: string }> => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`search-workspace-invite:${userId}`, 5, 1000)) {
      return err('Too many requests. Please wait a moment.')
    }

    const session = await getSession()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return ok(null)
    if (session?.user?.email?.toLowerCase() === normalizedEmail) return ok(null)

    const foundUser = await findUserByEmail(normalizedEmail)
    return ok(foundUser)
  } catch {
    return err('Error searching for that email')
  }
}

export interface WorkspaceInvite {
  id: string
  organizationId: string
  organizationName: string
  role: string
  inviterName: string | null
  createdAt: string
}

export const listMyWorkspaceInvites = async (): Promise<WorkspaceInvite[]> => {
  const session = await getSession()
  if (!session?.user) return []

  const invitations = await auth.api.listUserInvitations({ headers: await headers() })
  if (invitations.length === 0) return []

  const inviterIds = Array.from(new Set(invitations.map((i) => i.inviterId)))
  const invitersMap = await findUsersByIds(inviterIds)

  return invitations.map((i) => ({
    id: i.id,
    organizationId: i.organizationId,
    organizationName: i.organizationName,
    role: i.role,
    inviterName: invitersMap.get(i.inviterId)?.name ?? null,
    createdAt: i.createdAt as unknown as string,
  }))
}

export const acceptWorkspaceInvite = async (invitationId: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    await auth.api.acceptInvitation({
      headers: await headers(),
      body: { invitationId },
    })

    return ok(true)
  } catch {
    return err('Error while accepting the invitation')
  }
}

export const declineWorkspaceInvite = async (invitationId: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    await auth.api.rejectInvitation({
      headers: await headers(),
      body: { invitationId },
    })

    return ok(true)
  } catch {
    return err('Error while declining the invitation')
  }
}
