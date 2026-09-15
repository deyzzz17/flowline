import 'server-only'

import { cache } from 'react'
import { pool } from './db-pool'
import { getSession } from './get-session'
import type { WorkspaceRole } from './workspace-permissions'

/**
 * Whether a workspace was archived because its owner's plan no longer
 * covers it (a downgrade over the workspace-count limit — see
 * `workspace-archive` / checkWorkspacesCompliance in
 * src/api/workspaces/actions.ts). An archived workspace is invisible and
 * inaccessible to every member, owner included, exactly like an archived
 * list — until it's restored. Wrapped in `cache()` for the same reason as
 * getWorkspaceRoleForUser below: it's checked repeatedly per render.
 */
export const isWorkspaceArchived = cache(async (workspaceId: string): Promise<boolean> => {
  const result = await pool.query(`SELECT 1 FROM workspace_archive WHERE organization_id = $1 LIMIT 1`, [
    workspaceId,
  ])
  return result.rows.length > 0
})

/**
 * The active workspace, as a Better Auth organization id. `null` means the
 * Personal workspace — Personal is not an organization, it has no id. Also
 * `null` if the session's active workspace has since been archived — every
 * existing `if (!workspaceId) ...` guard already treats that the same as
 * "no workspace selected", so an archived workspace disappearing from view
 * (including for whoever had it open when it got archived) needs no extra
 * handling at each call site.
 */
export async function getCurrentWorkspaceId(): Promise<string | null> {
  const session = await getSession()
  const activeId = session?.session.activeOrganizationId ?? null
  if (!activeId) return null
  if (await isWorkspaceArchived(activeId)) return null
  return activeId
}

/**
 * Payload `where` fragment matching documents in the given workspace. Use
 * this instead of `{ workspace: { equals: workspaceId } }` directly, since a
 * `null` (Personal) workspace must match on absence of the field instead.
 */
export function workspaceWhereClause(workspaceId: string | null) {
  return workspaceId ? { workspace: { equals: workspaceId } } : { workspace: { exists: false } }
}

/**
 * The caller's role in a given workspace, for role-based restrictions
 * (see src/lib/workspace-permissions.ts). `null` for Personal (workspaceId
 * is `null`), if the workspace is archived (nobody has a role while
 * archived, owner included), or if the user somehow isn't actually a member
 * — all three cases mean "no restriction" to
 * canPermanentlyDeleteTask/canDeleteCalendarCategory, which is correct for
 * Personal but callers should still gate access separately (e.g. via
 * resolveListRole) since this alone doesn't confirm the user belongs to the
 * workspace at all.
 *
 * Wrapped in React's `cache()` — this gets called once per list per render
 * (sidebar, list pages, workspace-scoped queries all resolve it independently
 * for the same workspaceId/userId pair), so deduping within a single request
 * avoids repeat round trips for a value that can't change mid-render.
 */
export const getWorkspaceRoleForUser = cache(
  async (workspaceId: string | null, userId: string): Promise<WorkspaceRole> => {
    if (!workspaceId) return null
    if (await isWorkspaceArchived(workspaceId)) return null
    const result = await pool.query(
      `SELECT role FROM member WHERE "organizationId" = $1 AND "userId" = $2`,
      [workspaceId, userId],
    )
    const role = result.rows[0]?.role
    return role === 'owner' || role === 'admin' || role === 'member' || role === 'viewer'
      ? role
      : null
  },
)

/**
 * Per-workspace display-name overrides (the `nickname` additionalField on
 * Better Auth's `member` — see auth.ts), keyed by userId, for every member
 * of the given workspace who has actually set one. Callers should fall back
 * to the account's own name for any id missing from the map.
 */
export async function getWorkspaceNicknames(workspaceId: string): Promise<Map<string, string>> {
  const result = await pool.query(
    `SELECT "userId", nickname FROM member WHERE "organizationId" = $1 AND nickname IS NOT NULL AND nickname <> ''`,
    [workspaceId],
  )
  const map = new Map<string, string>()
  for (const row of result.rows) map.set(row.userId, row.nickname)
  return map
}

/**
 * Swaps in each profile's per-workspace nickname (when one is set) in place
 * of their global account name. Use this anywhere a member's name is shown
 * inside a workspace — assignee pickers, comments, list member panels,
 * invite dialogs — so it reflects what was set on the workspace's Members
 * page rather than the account's own global name.
 */
export function applyWorkspaceNicknames<T extends { id: string; name: string }>(
  profiles: T[],
  nicknames: Map<string, string>,
): T[] {
  if (nicknames.size === 0) return profiles
  return profiles.map((p) => (nicknames.has(p.id) ? { ...p, name: nicknames.get(p.id)! } : p))
}
