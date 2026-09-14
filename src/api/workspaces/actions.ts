'use server'

import 'server-only'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db-pool'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { auth } from '@/lib/auth'
import { ok, err } from '@/types/result'
import { getSession } from '@/lib/get-session'
import { getUserPlanLimits, getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'
import { checkRateLimit } from '@/lib/rate-limit'
import { getWorkspaceRoleForUser } from '@/lib/get-current-workspace'
import { findUserByEmail, findUsersByIds, type ContactProfile } from '@/api/contacts/actions'
import { deleteCommentsForTaskIds } from '@/api/task-comments/actions'
import type { WorkspaceRole } from '@/lib/workspace-permissions'

// Better Auth's org plugin ships owner (auto-assigned to the creator, not
// invitable), admin, and member; "viewer" is a custom 4th read-only role.
// We only ever invite as one of these three — "member" is displayed as
// "Editor" in the UI.
export type WorkspaceInviteRole = 'admin' | 'member' | 'viewer'

const DEFAULT_ICON = 'Building2'
const DEFAULT_COLOR = '#8b5cf6'

export interface WorkspaceSummary {
  /** Better Auth organization id, or `null` for the Personal workspace. */
  id: string | null
  name: string
  isPersonal: boolean
  icon: string
  color: string
  /** The caller's own role in this workspace — `null` for Personal. */
  myRole: WorkspaceRole
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

async function getMyRolesByOrgId(userId: string): Promise<Map<string, WorkspaceRole>> {
  const result = await pool.query(`SELECT "organizationId", role FROM member WHERE "userId" = $1`, [
    userId,
  ])
  const map = new Map<string, WorkspaceRole>()
  for (const row of result.rows) {
    const role =
      row.role === 'owner' || row.role === 'admin' || row.role === 'member' || row.role === 'viewer'
        ? row.role
        : null
    map.set(row.organizationId, role)
  }
  return map
}

// Batched version of isWorkspaceArchived for a whole list of orgs at once —
// used wherever we're about to render/count a set of workspaces, instead of
// N separate lookups.
async function getArchivedOrgIdSet(orgIds: string[]): Promise<Set<string>> {
  if (orgIds.length === 0) return new Set()
  const result = await pool.query(
    `SELECT organization_id FROM workspace_archive WHERE organization_id = ANY($1)`,
    [orgIds],
  )
  return new Set(result.rows.map((r) => r.organization_id as string))
}

export const listWorkspaces = async () => {
  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) return { docs: [] as WorkspaceSummary[], activeId: null as string | null }

  const orgs = await auth.api.listOrganizations({ headers: await headers() })
  const rolesByOrgId = await getMyRolesByOrgId(userId)
  // Archived workspaces are invisible to every member, owner included — not
  // just hidden from whoever archived them — so this filters the same way
  // regardless of which member's session called listWorkspaces().
  const archivedIds = await getArchivedOrgIdSet(orgs.map((o) => o.id))
  const visibleOrgs = orgs.filter((o) => !archivedIds.has(o.id))

  const docs: WorkspaceSummary[] = [
    { id: null, name: 'Personal', isPersonal: true, icon: 'User', color: '#8b5cf6', myRole: null },
    ...visibleOrgs.map((o) => ({
      id: o.id,
      name: o.name,
      isPersonal: false,
      ...parseMetadata(o.metadata),
      myRole: rolesByOrgId.get(o.id) ?? null,
    })),
  ]

  const rawActiveId = session.session.activeOrganizationId ?? null
  const activeId = rawActiveId && !archivedIds.has(rawActiveId) ? rawActiveId : null

  return { docs, activeId }
}

// Only organizations this user OWNS count against their plan's workspace
// limit — being invited into someone else's workspace shouldn't use up your
// own quota. Archived workspaces don't count either — that's the entire
// point of archiving one: it frees up the slot for a new (or restored) one.
async function countOwnedWorkspaces(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT m."organizationId" FROM member m WHERE m."userId" = $1 AND m.role = 'owner'`,
    [userId],
  )
  const ownedIds: string[] = result.rows.map((r) => r.organizationId)
  if (ownedIds.length === 0) return 0
  const archivedIds = await getArchivedOrgIdSet(ownedIds)
  return ownedIds.filter((id) => !archivedIds.has(id)).length
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
        myRole: 'owner',
      } as WorkspaceSummary,
      failedInvites,
    })
  } catch {
    return err('Error while creating the workspace')
  }
}

export interface WorkspacesComplianceInfo {
  overBy: number
  limit: number
  workspaces: { id: string; name: string; icon: string; color: string }[]
}

// Checked for the current user — only ownership counts against the
// workspace-count limit, same rule as countOwnedWorkspaces/createWorkspace.
export const checkWorkspacesCompliance = async (): Promise<WorkspacesComplianceInfo | null> => {
  const userId = await getUserId()
  if (!userId) return null

  const { limits } = await getUserPlanLimits()
  if (limits.workspaces === Infinity) return null

  const ownedResult = await pool.query(
    `SELECT m."organizationId", o.name, o.metadata
     FROM member m
     JOIN organization o ON o.id = m."organizationId"
     WHERE m."userId" = $1 AND m.role = 'owner'`,
    [userId],
  )
  if (ownedResult.rows.length === 0) return null

  const archivedIds = await getArchivedOrgIdSet(ownedResult.rows.map((r) => r.organizationId))
  const activeOwned = ownedResult.rows.filter((r) => !archivedIds.has(r.organizationId))

  if (activeOwned.length <= limits.workspaces) return null

  return {
    overBy: activeOwned.length - limits.workspaces,
    limit: limits.workspaces,
    workspaces: activeOwned.map((r) => ({
      id: r.organizationId,
      name: r.name,
      ...parseMetadata(r.metadata),
    })),
  }
}

export const chooseWorkspacesToKeep = async (keepIds: string[]) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const { limits } = await getUserPlanLimits()
    if (keepIds.length > limits.workspaces) return err('TOO_MANY_SELECTED')

    const ownedResult = await pool.query(
      `SELECT "organizationId" FROM member WHERE "userId" = $1 AND role = 'owner'`,
      [userId],
    )
    const ownedIds: string[] = ownedResult.rows.map((r) => r.organizationId)
    const archivedIds = await getArchivedOrgIdSet(ownedIds)
    const activeOwnedIds = ownedIds.filter((id) => !archivedIds.has(id))

    const keepSet = new Set(keepIds)
    const toArchive = activeOwnedIds.filter((id) => !keepSet.has(id))

    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    for (const orgId of toArchive) {
      await payload.create({
        collection: 'workspace-archive',
        data: { organizationId: orgId, ownerId: userId, archivedAt: now },
      })
    }

    // If the caller's own active workspace is one of the ones just
    // archived, switch them back to Personal — otherwise they'd be left
    // pointed at a workspace that has, from this moment on, quietly
    // disappeared from their own switcher.
    const session = await getSession()
    const activeId = session?.session.activeOrganizationId ?? null
    if (activeId && toArchive.includes(activeId)) {
      await auth.api.setActiveOrganization({
        headers: await headers(),
        body: { organizationId: null },
      })
    }

    revalidatePath('/')
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error updating workspaces'
    return err(message)
  }
}

export interface ArchivedWorkspace {
  id: number
  organizationId: string
  name: string
  icon: string
  color: string
  archivedAt: string
}

// Only the owner sees this — matches chooseWorkspacesToKeep, which only the
// owner can act on in the first place.
export const listArchivedWorkspaces = async (): Promise<{ docs: ArchivedWorkspace[] }> => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'workspace-archive',
    where: { ownerId: { equals: userId } },
    sort: '-archivedAt',
    limit: 0,
  })
  if (docs.length === 0) return { docs: [] }

  const orgResult = await pool.query(`SELECT id, name, metadata FROM organization WHERE id = ANY($1)`, [
    docs.map((d) => d.organizationId),
  ])
  const orgById = new Map(orgResult.rows.map((r) => [r.id as string, r]))

  return {
    docs: docs.map((d) => {
      const org = orgById.get(d.organizationId)
      return {
        id: d.id,
        organizationId: d.organizationId,
        name: org?.name ?? 'Workspace',
        ...parseMetadata(org?.metadata),
        archivedAt: d.archivedAt as unknown as string,
      }
    }),
  }
}

export const restoreWorkspace = async (archiveId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const archived = await payload
      .findByID({ collection: 'workspace-archive', id: archiveId })
      .catch(() => null)
    if (!archived || archived.ownerId !== userId) return err('Not authorized')

    const { plan, limits } = await getUserPlanLimits()
    const ownedCount = await countOwnedWorkspaces(userId)
    if (isAtLimit(ownedCount, limits.workspaces)) {
      return err(
        isPlanUnlimited(plan, 'workspaces')
          ? SAFETY_CAP_ERRORS.WORKSPACES_CAP
          : LIMIT_ERRORS.WORKSPACES_LIMIT,
      )
    }

    await payload.delete({ collection: 'workspace-archive', id: archiveId })

    revalidatePath('/')
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error restoring workspace'
    return err(message)
  }
}

// Mirrors restoreAllArchivedListsForUserId — called on a plan upgrade,
// restoring as many archived workspaces as now fit (oldest-archived first).
// Since the organization itself was never touched, "restoring" is just
// deleting the archive row — everything about the workspace (its lists,
// tasks, members) was exactly as the owner left it the whole time.
export async function restoreAllArchivedWorkspacesForUserId(userId: string): Promise<void> {
  try {
    const { limits } = await getPlanLimitsForUserId(userId)

    const ownedCount = await countOwnedWorkspaces(userId)
    const room =
      limits.workspaces === Infinity ? Infinity : Math.max(0, limits.workspaces - ownedCount)
    if (room <= 0) return

    const payload = await getPayload({ config })
    const { docs: archived } = await payload.find({
      collection: 'workspace-archive',
      where: { ownerId: { equals: userId } },
      sort: 'archivedAt',
      limit: room === Infinity ? 0 : room,
    })

    for (const a of archived) {
      await payload.delete({ collection: 'workspace-archive', id: a.id })
    }
  } catch (e) {
    console.error('restoreAllArchivedWorkspacesForUserId error:', e)
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

    // Deletes the organization itself and, via Better Auth's own cascading
    // FKs, its member/invitation rows — but "workspace" on our own
    // collections is a plain text column, not a real relation to the
    // organization table, so it never cascades. Clean those up ourselves,
    // and only after the org deletion actually succeeds (permission-checked
    // by Better Auth itself), so a rejected delete can't destroy content
    // while leaving the workspace/membership intact.
    await auth.api.deleteOrganization({
      headers: await headers(),
      body: { organizationId: workspaceId },
    })

    const payload = await getPayload({ config })

    const { docs: lists } = await payload.find({
      collection: 'lists',
      where: { workspace: { equals: workspaceId } },
      limit: 0,
    })
    for (const list of lists) {
      const { docs: tasks } = await payload.find({
        collection: 'tasks',
        where: { list: { equals: list.id } },
        limit: 0,
      })
      if (tasks.length > 0) {
        await deleteCommentsForTaskIds(tasks.map((t) => t.id))
      }
      for (const task of tasks) {
        await payload.delete({ collection: 'tasks', id: task.id })
      }
      const { docs: listMembers } = await payload.find({
        collection: 'list-members',
        where: { list: { equals: list.id } },
        limit: 0,
      })
      for (const member of listMembers) {
        await payload.delete({ collection: 'list-members', id: member.id })
      }
      await payload.delete({ collection: 'lists', id: list.id })
    }

    const { docs: taskCompletions } = await payload.find({
      collection: 'task-completions',
      where: { workspace: { equals: workspaceId } },
      limit: 0,
    })
    for (const completion of taskCompletions) {
      await payload.delete({ collection: 'task-completions', id: completion.id })
    }

    const { docs: calendarEvents } = await payload.find({
      collection: 'calendar-events',
      where: { workspace: { equals: workspaceId } },
      limit: 0,
    })
    for (const event of calendarEvents) {
      await payload.delete({ collection: 'calendar-events', id: event.id })
    }

    const { docs: calendarCategories } = await payload.find({
      collection: 'calendar-categories',
      where: { workspace: { equals: workspaceId } },
      limit: 0,
    })
    for (const category of calendarCategories) {
      await payload.delete({ collection: 'calendar-categories', id: category.id })
    }

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
  const currentUserId = session?.user?.id ?? null

  const { members } = await auth.api.listMembers({
    headers: await headers(),
    query: { organizationId: workspaceId },
  })

  // Owner first, then the caller themselves (unless they already are the
  // owner), then everyone else in the order they joined.
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'owner' && b.role !== 'owner') return -1
    if (b.role === 'owner' && a.role !== 'owner') return 1
    if (a.userId === currentUserId && b.userId !== currentUserId) return -1
    if (b.userId === currentUserId && a.userId !== currentUserId) return 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const docs: WorkspaceMember[] = sortedMembers.map((m) => ({
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

// The workspace's plan quota is governed by its owner's subscription, not
// whoever happens to be inviting (an admin can invite too), so the member
// limit check always needs to resolve the actual owner first.
async function getWorkspaceOwnerId(workspaceId: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT "userId" FROM member WHERE "organizationId" = $1 AND role = 'owner' LIMIT 1`,
    [workspaceId],
  )
  return result.rows[0]?.userId ?? null
}

// Counts both accepted members and still-pending invitations as occupied
// seats — otherwise sending 5 invites at once on a 3-member plan would let
// all 5 land before anyone even accepts.
async function countWorkspaceMembers(workspaceId: string): Promise<number> {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM member WHERE "organizationId" = $1) AS member_count,
       (SELECT COUNT(*)::int FROM invitation WHERE "organizationId" = $1 AND status = 'pending') AS pending_count`,
    [workspaceId],
  )
  const row = result.rows[0]
  return (row?.member_count ?? 0) + (row?.pending_count ?? 0)
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

    const ownerId = await getWorkspaceOwnerId(workspaceId)
    if (!ownerId) return err('Workspace owner not found')

    const { plan, limits } = await getPlanLimitsForUserId(ownerId)
    const memberCount = await countWorkspaceMembers(workspaceId)
    if (isAtLimit(memberCount, limits.workspaceMembers)) {
      return err(
        isPlanUnlimited(plan, 'workspaceMembers')
          ? SAFETY_CAP_ERRORS.WORKSPACE_MEMBERS_CAP
          : LIMIT_ERRORS.WORKSPACE_MEMBERS_LIMIT,
      )
    }

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

export interface WorkspaceMembersComplianceInfo {
  workspaceId: string
  workspaceName: string
  overBy: number
  /** Non-owner seats available — the owner itself always keeps its own seat separately. */
  limit: number
  members: {
    id: string
    userId: string
    label: string
    email: string
    image: string | null
    role: string
  }[]
}

// Checked for every workspace this user OWNS — a Pro owner with several
// workspaces who downgrades to Plus can have more than one over its new
// member limit at once, so this returns all of them, not just the first.
// Personal never appears here — it isn't an organization, it has no members.
export const checkWorkspaceMembersCompliance = async (): Promise<
  WorkspaceMembersComplianceInfo[]
> => {
  const userId = await getUserId()
  if (!userId) return []

  const { limits } = await getUserPlanLimits()
  if (limits.workspaceMembers === Infinity) return []

  const ownedResult = await pool.query(
    `SELECT "organizationId" FROM member WHERE "userId" = $1 AND role = 'owner'`,
    [userId],
  )
  const allOwnedOrgIds: string[] = ownedResult.rows.map((r) => r.organizationId)
  if (allOwnedOrgIds.length === 0) return []

  // An already-archived workspace is inaccessible to everyone regardless of
  // its member count — no point asking who should stay in a workspace
  // nobody can open.
  const archivedIds = await getArchivedOrgIdSet(allOwnedOrgIds)
  const ownedOrgIds = allOwnedOrgIds.filter((id) => !archivedIds.has(id))
  if (ownedOrgIds.length === 0) return []

  const requestHeaders = await headers()
  const keepableSlots = Math.max(0, limits.workspaceMembers - 1)
  const results: WorkspaceMembersComplianceInfo[] = []

  for (const orgId of ownedOrgIds) {
    const { members } = await auth.api.listMembers({
      headers: requestHeaders,
      query: { organizationId: orgId },
    })
    const nonOwnerMembers = members.filter((m) => m.role !== 'owner')
    if (nonOwnerMembers.length <= keepableSlots) continue

    const orgResult = await pool.query(`SELECT name FROM organization WHERE id = $1`, [orgId])

    results.push({
      workspaceId: orgId,
      workspaceName: orgResult.rows[0]?.name ?? 'Workspace',
      overBy: nonOwnerMembers.length - keepableSlots,
      limit: keepableSlots,
      members: nonOwnerMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        label: m.nickname || m.user.name,
        email: m.user.email,
        image: m.user.image ?? null,
        role: m.role,
      })),
    })
  }

  return results
}

export const chooseWorkspaceMembersToKeep = async (workspaceId: string, keepUserIds: string[]) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    // Only the owner decides who stays — an admin invited by the owner
    // could itself be one of the people over the limit.
    const ownerId = await getWorkspaceOwnerId(workspaceId)
    if (!ownerId || ownerId !== userId) return err('Not authorized')

    const { limits } = await getPlanLimitsForUserId(ownerId)
    const keepableSlots = Math.max(0, limits.workspaceMembers - 1)
    if (keepUserIds.length > keepableSlots) return err('TOO_MANY_SELECTED')

    const requestHeaders = await headers()
    const { members } = await auth.api.listMembers({
      headers: requestHeaders,
      query: { organizationId: workspaceId },
    })

    const keepSet = new Set(keepUserIds)
    const toRemove = members.filter((m) => m.role !== 'owner' && !keepSet.has(m.userId))

    const payload = await getPayload({ config })
    const now = new Date().toISOString()

    for (const member of toRemove) {
      await payload.create({
        collection: 'workspace-member-archive',
        data: {
          organizationId: workspaceId,
          userId: member.userId,
          role: member.role,
          removedBy: userId,
          archivedAt: now,
        },
      })
      await auth.api.removeMember({
        headers: requestHeaders,
        body: { memberIdOrEmail: member.id, organizationId: workspaceId },
      })
    }

    // Pending invitations are non-binding — nothing of theirs to preserve —
    // so any that don't fit in the room actually freed up are simply
    // canceled rather than forcing a second, separate decision about
    // invites nobody has even accepted yet.
    const roomLeft = keepableSlots - keepUserIds.length
    const invitesResult = await pool.query(
      `SELECT id FROM invitation WHERE "organizationId" = $1 AND status = 'pending' ORDER BY "createdAt" ASC`,
      [workspaceId],
    )
    const toCancelIds = invitesResult.rows.slice(Math.max(0, roomLeft)).map((r) => r.id)
    for (const invitationId of toCancelIds) {
      await auth.api
        .cancelInvitation({ headers: requestHeaders, body: { invitationId } })
        .catch(() => {})
    }

    revalidatePath('/')
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error updating workspace members'
    return err(message)
  }
}

export interface ArchivedWorkspaceMember {
  id: number
  userId: string
  name: string
  email: string
  image: string | null
  role: string
  archivedAt: string
}

// Scoped to the active workspace, same as listWorkspaceMembers — shown in
// the Members page so the owner/admin can bring someone back once there's
// room again (a plan upgrade, or removing someone else first).
export const listArchivedWorkspaceMembers = async (): Promise<{
  docs: ArchivedWorkspaceMember[]
}> => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const session = await getSession()
  const workspaceId = session?.session.activeOrganizationId
  if (!workspaceId) return { docs: [] }

  const role = await getWorkspaceRoleForUser(workspaceId, userId)
  if (role !== 'owner' && role !== 'admin') return { docs: [] }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'workspace-member-archive',
    where: { organizationId: { equals: workspaceId } },
    sort: '-archivedAt',
    limit: 0,
  })
  if (docs.length === 0) return { docs: [] }

  const profiles = await findUsersByIds(docs.map((d) => d.userId))

  return {
    docs: docs.map((d) => {
      const profile = profiles.get(d.userId)
      return {
        id: d.id,
        userId: d.userId,
        name: profile?.name ?? 'Former member',
        email: profile?.email ?? '',
        image: profile?.image ?? null,
        role: d.role,
        archivedAt: d.archivedAt as unknown as string,
      }
    }),
  }
}

export const restoreWorkspaceMember = async (archiveId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const archived = await payload
      .findByID({ collection: 'workspace-member-archive', id: archiveId })
      .catch(() => null)
    if (!archived) return err('Not found')

    const role = await getWorkspaceRoleForUser(archived.organizationId, userId)
    if (role !== 'owner' && role !== 'admin') return err('Not authorized')

    const ownerId = await getWorkspaceOwnerId(archived.organizationId)
    if (!ownerId) return err('Workspace owner not found')

    const { plan, limits } = await getPlanLimitsForUserId(ownerId)
    const memberCount = await countWorkspaceMembers(archived.organizationId)
    if (isAtLimit(memberCount, limits.workspaceMembers)) {
      return err(
        isPlanUnlimited(plan, 'workspaceMembers')
          ? SAFETY_CAP_ERRORS.WORKSPACE_MEMBERS_CAP
          : LIMIT_ERRORS.WORKSPACE_MEMBERS_LIMIT,
      )
    }

    await auth.api.addMember({
      headers: await headers(),
      body: {
        userId: archived.userId,
        organizationId: archived.organizationId,
        role: archived.role as WorkspaceInviteRole,
      },
    })

    await payload.delete({ collection: 'workspace-member-archive', id: archiveId })

    revalidatePath('/')
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error restoring member'
    return err(message)
  }
}

// Mirrors restoreAllArchivedListsForUserId — called on a plan upgrade, once
// per workspace this user owns, restoring as many archived members as now
// fit (oldest-removed first) via addMember(), which re-adds them instantly
// with their previous role and skips the invite/accept round-trip entirely.
export async function restoreAllArchivedWorkspaceMembersForUserId(userId: string): Promise<void> {
  try {
    const { limits } = await getPlanLimitsForUserId(userId)

    const ownedResult = await pool.query(
      `SELECT "organizationId" FROM member WHERE "userId" = $1 AND role = 'owner'`,
      [userId],
    )
    const ownedOrgIds: string[] = ownedResult.rows.map((r) => r.organizationId)
    if (ownedOrgIds.length === 0) return

    const payload = await getPayload({ config })
    const requestHeaders = await headers()

    for (const orgId of ownedOrgIds) {
      const { docs: archivedForOrg } = await payload.find({
        collection: 'workspace-member-archive',
        where: { organizationId: { equals: orgId } },
        sort: 'archivedAt',
        limit: 0,
      })
      if (archivedForOrg.length === 0) continue

      let memberCount = await countWorkspaceMembers(orgId)

      for (const archived of archivedForOrg) {
        if (limits.workspaceMembers !== Infinity && memberCount >= limits.workspaceMembers) break

        await auth.api
          .addMember({
            headers: requestHeaders,
            body: {
              userId: archived.userId,
              organizationId: orgId,
              role: archived.role as WorkspaceInviteRole,
            },
          })
          .catch(() => null)

        await payload.delete({ collection: 'workspace-member-archive', id: archived.id })
        memberCount++
      }
    }
  } catch (e) {
    console.error('restoreAllArchivedWorkspaceMembersForUserId error:', e)
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

    // Re-checked here, not just at invite time — other invites sent around
    // the same time could have filled the workspace up in the meantime.
    const invitationResult = await pool.query(
      `SELECT "organizationId" FROM invitation WHERE id = $1`,
      [invitationId],
    )
    const workspaceId = invitationResult.rows[0]?.organizationId as string | undefined
    if (workspaceId) {
      const ownerId = await getWorkspaceOwnerId(workspaceId)
      if (ownerId) {
        const { limits } = await getPlanLimitsForUserId(ownerId)
        const memberCount = await countWorkspaceMembers(workspaceId)
        if (isAtLimit(memberCount, limits.workspaceMembers)) {
          return err('This workspace has reached its member limit. Ask the owner to upgrade the plan.')
        }
      }
    }

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
