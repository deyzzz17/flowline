import 'server-only'

import { cache } from 'react'
import { pool } from './db-pool'
import { getSession } from './get-session'
import type { WorkspaceRole } from './workspace-permissions'
import {
  canModifyWorkspaceContent,
  canPermanentlyDeleteTask,
  canDeleteCalendarCategory,
} from './workspace-permissions'

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

export interface EffectiveWorkspacePermissions {
  role: WorkspaceRole
  /** Name of the assigned custom role, if any — for display purposes. */
  customRoleName: string | null
  /** Rename the workspace, change its icon/color. */
  canManageWorkspaceSettings: boolean
  /** Invite/remove workspace members and change their role. */
  canManageMembers: boolean
  /** Create lists directly in the workspace (outside of any team). */
  canManageLists: boolean
  /** Create calendar events/categories directly in the workspace (outside of any team). */
  canManageCalendar: boolean
  /** Create teams in this workspace. */
  canManageTeams: boolean
  canPermanentlyDeleteTasks: boolean
  canDeleteCalendarCategories: boolean
}

/**
 * The permissions a user actually has in a workspace, folding in a custom
 * role's checkboxes (see api/custom-roles/actions.ts) when one is assigned
 * on top of the plain owner/admin/member/viewer defaults from
 * workspace-permissions.ts. `workspaceId: null` means Personal, which is
 * always unrestricted and never has a custom role.
 */
export async function getEffectiveWorkspacePermissions(
  workspaceId: string | null,
  userId: string,
): Promise<EffectiveWorkspacePermissions> {
  const role = await getWorkspaceRoleForUser(workspaceId, userId)
  // Owner/admin (or Personal, where there's no restriction at all) get every
  // permission by default — a custom role can only ever narrow that down
  // for admin-tier folks, or grant extra to a plain member-tier one.
  const isAdminTier = role === 'owner' || role === 'admin' || role === null
  const base: EffectiveWorkspacePermissions = {
    role,
    customRoleName: null,
    canManageWorkspaceSettings: isAdminTier,
    canManageMembers: isAdminTier,
    canManageLists: canModifyWorkspaceContent(role),
    canManageCalendar: canModifyWorkspaceContent(role),
    canManageTeams: isAdminTier,
    canPermanentlyDeleteTasks: canPermanentlyDeleteTask(role),
    canDeleteCalendarCategories: canDeleteCalendarCategory(role),
  }
  if (!workspaceId || !role) return base

  const result = await pool.query(
    `SELECT
       cr.name,
       cr.can_manage_workspace_settings AS "canManageWorkspaceSettings",
       cr.can_manage_members AS "canManageMembers",
       cr.can_manage_lists AS "canManageLists",
       cr.can_manage_calendar AS "canManageCalendar",
       cr.can_manage_teams AS "canManageTeams",
       cr.can_permanently_delete_tasks AS "canPermanentlyDeleteTasks",
       cr.can_delete_calendar_categories AS "canDeleteCalendarCategories"
     FROM member m
     JOIN custom_roles cr ON cr.id::text = m."customRoleId"
     WHERE m."organizationId" = $1 AND m."userId" = $2 AND m."customRoleId" IS NOT NULL`,
    [workspaceId, userId],
  )
  const row = result.rows[0]
  if (!row) return base

  return {
    role,
    customRoleName: row.name,
    canManageWorkspaceSettings: row.canManageWorkspaceSettings,
    canManageMembers: row.canManageMembers,
    canManageLists: row.canManageLists,
    canManageCalendar: row.canManageCalendar,
    canManageTeams: row.canManageTeams,
    canPermanentlyDeleteTasks: row.canPermanentlyDeleteTasks,
    canDeleteCalendarCategories: row.canDeleteCalendarCategories,
  }
}
