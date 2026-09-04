import 'server-only'

import { Pool } from 'pg'
import { getSession } from './get-session'
import type { WorkspaceRole } from './workspace-permissions'

/**
 * The active workspace, as a Better Auth organization id. `null` means the
 * Personal workspace — Personal is not an organization, it has no id.
 */
export async function getCurrentWorkspaceId(): Promise<string | null> {
  const session = await getSession()
  return session?.session.activeOrganizationId ?? null
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
 * is `null`) or if the user somehow isn't actually a member — both cases
 * mean "no restriction" to canPermanentlyDeleteTask/canDeleteCalendarCategory,
 * which is correct for Personal but callers should still gate access
 * separately (e.g. via resolveListRole) since this alone doesn't confirm
 * the user belongs to the workspace at all.
 */
export async function getWorkspaceRoleForUser(
  workspaceId: string | null,
  userId: string,
): Promise<WorkspaceRole> {
  if (!workspaceId) return null
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(
      `SELECT role FROM member WHERE "organizationId" = $1 AND "userId" = $2`,
      [workspaceId, userId],
    )
    const role = result.rows[0]?.role
    return role === 'owner' || role === 'admin' || role === 'member' || role === 'viewer'
      ? role
      : null
  } finally {
    await pool.end()
  }
}
