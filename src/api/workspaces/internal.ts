import 'server-only'

import type { WorkspaceInviteRole } from './actions'
import { headers } from 'next/headers'
import { pool } from '@/lib/db-pool'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { auth } from '@/lib/auth'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'

// Server-only helpers for other server code (webhooks, jobs, other actions).
// They take user/team ids as trusted input, so they must never be server
// actions: anything exported from a 'use server' file can be called from
// the browser with arbitrary arguments.

// Batched version of isWorkspaceArchived for a whole list of orgs at once —
// used wherever we're about to render/count a set of workspaces, instead of
// N separate lookups.
export async function getArchivedOrgIdSet(orgIds: string[]): Promise<Set<string>> {
  if (orgIds.length === 0) return new Set()
  const result = await pool.query(
    `SELECT organization_id FROM workspace_archive WHERE organization_id = ANY($1)`,
    [orgIds],
  )
  return new Set(result.rows.map((r) => r.organization_id as string))
}

// Only organizations this user OWNS count against their plan's workspace
// limit — being invited into someone else's workspace shouldn't use up your
// own quota. Archived workspaces don't count either — that's the entire
// point of archiving one: it frees up the slot for a new (or restored) one.
export async function countOwnedWorkspaces(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT m."organizationId" FROM member m WHERE m."userId" = $1 AND m.role = 'owner'`,
    [userId],
  )
  const ownedIds: string[] = result.rows.map((r) => r.organizationId)
  if (ownedIds.length === 0) return 0
  const archivedIds = await getArchivedOrgIdSet(ownedIds)
  return ownedIds.filter((id) => !archivedIds.has(id)).length
}

// Counts both accepted members and still-pending invitations as occupied
// seats — otherwise sending 5 invites at once on a 3-member plan would let
// all 5 land before anyone even accepts.
export async function countWorkspaceMembers(workspaceId: string): Promise<number> {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM member WHERE "organizationId" = $1) AS member_count,
       (SELECT COUNT(*)::int FROM invitation WHERE "organizationId" = $1 AND status = 'pending') AS pending_count`,
    [workspaceId],
  )
  const row = result.rows[0]
  return (row?.member_count ?? 0) + (row?.pending_count ?? 0)
}

// The workspace's plan quota is governed by its owner's subscription, not
// whoever happens to be inviting (an admin can invite too), so the member
// limit check always needs to resolve the actual owner first.
export async function getWorkspaceOwnerId(workspaceId: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT "userId" FROM member WHERE "organizationId" = $1 AND role = 'owner' LIMIT 1`,
    [workspaceId],
  )
  return result.rows[0]?.userId ?? null
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
