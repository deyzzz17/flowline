'use server'

import 'server-only'

import { headers } from 'next/headers'
import { Pool } from 'pg'
import { auth } from '@/lib/auth'
import { ok, err } from '@/types/result'
import { getSession } from '@/lib/get-session'
import { getUserPlanLimits } from '@/lib/get-user-plan'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'
import { listTasksToday } from '@/api/tasks/actions'

export interface WorkspaceSummary {
  /** Better Auth organization id, or `null` for the Personal workspace. */
  id: string | null
  name: string
  isPersonal: boolean
}

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export const listWorkspaces = async () => {
  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) return { docs: [] as WorkspaceSummary[], activeId: null as string | null }

  const orgs = await auth.api.listOrganizations({ headers: await headers() })

  const docs: WorkspaceSummary[] = [
    { id: null, name: 'Personal', isPersonal: true },
    ...orgs.map((o) => ({ id: o.id, name: o.name, isPersonal: false })),
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

export const createWorkspace = async (name: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const trimmed = name.trim()
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

    const org = await auth.api.createOrganization({
      headers: await headers(),
      body: { name: trimmed, slug },
    })

    if (!org) return err('Error while creating the workspace')

    return ok<WorkspaceSummary>({ id: org.id, name: org.name, isPersonal: false })
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

// Combines the switch with fetching the new workspace's Today tasks in one
// round trip (instead of two sequential ones from the client) — the biggest
// remaining latency in making the switcher feel instant. Must pass
// workspaceId explicitly to listTasksToday rather than letting it read the
// session: within this same request, the session is memoized from before
// the switch above, so a plain getCurrentWorkspaceId() call here would still
// return the OLD active workspace.
export const switchWorkspaceAndGetToday = async (workspaceId: string | null) => {
  const switchResult = await switchWorkspace(workspaceId)
  if (!switchResult.ok) return { switchResult, today: null }

  const today = await listTasksToday('workspace', workspaceId)
  return { switchResult, today }
}
