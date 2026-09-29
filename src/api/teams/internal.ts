import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { getEffectiveWorkspacePermissions } from '@/lib/get-current-workspace'

// Server-only helpers for other server code (webhooks, jobs, other actions).
// They take user/team ids as trusted input, so they must never be server
// actions: anything exported from a 'use server' file can be called from
// the browser with arbitrary arguments.

const NO_PERMISSIONS: TeamPermissions = {
  canManageLists: false,
  canManageCalendar: false,
  canManageMembers: false,
  canManageTeamSettings: false,
}

const ALL_PERMISSIONS: TeamPermissions = {
  canManageLists: true,
  canManageCalendar: true,
  canManageMembers: true,
  canManageTeamSettings: true,
}

// The team's own creator always has full access — an irreducible safety
// net so they can never lock themselves out of a team they made. Beyond
// that, an EXPLICIT team-member assignment always wins, even for someone
// who is otherwise the workspace owner/admin: deliberately giving them a
// restricted role on this one team must actually restrict them here, not
// be silently overridden. Only someone who was never added to the team at
// all falls back to the workspace-wide owner/admin override, and even then
// only a plain, non-custom owner/admin counts — a custom workspace role's
// underlying Better Auth tier is only ever derived to 'admin' to satisfy
// Better Auth's own invite/remove/role-change endpoints (see
// deriveBetterAuthRole), not a real admin designation, so it must not
// bypass every team's own roles either.
export async function getTeamPermissionsForUser(
  payload: Awaited<ReturnType<typeof getPayload>>,
  teamId: number,
  workspaceId: string,
  userId: string,
): Promise<TeamPermissions> {
  const team = await payload.findByID({ collection: 'teams', id: teamId }).catch(() => null)
  if (!team) return NO_PERMISSIONS
  if (team.createdBy === userId) return ALL_PERMISSIONS

  const { docs } = await payload.find({
    collection: 'team-members',
    where: { and: [{ team: { equals: teamId } }, { userId: { equals: userId } }] },
    limit: 1,
    depth: 1,
  })
  const member = docs[0]
  const role = member && typeof member.teamRole === 'object' ? member.teamRole : null
  if (role) {
    return {
      canManageLists: !!role.canManageLists,
      canManageCalendar: !!role.canManageCalendar,
      canManageMembers: !!role.canManageMembers,
      canManageTeamSettings: !!role.canManageTeamSettings,
    }
  }

  const effective = await getEffectiveWorkspacePermissions(workspaceId, userId)
  const isPlainOwnerOrAdmin =
    (effective.role === 'owner' || effective.role === 'admin') && effective.customRoleName === null
  return isPlainOwnerOrAdmin ? ALL_PERMISSIONS : NO_PERMISSIONS
}

/** Same as getTeamPermissionsForUser, but resolves its own payload/workspace — for callers outside teams/actions.ts (e.g. list/calendar creation) that only have a teamId and userId on hand. */
export async function getTeamPermissions(teamId: number, userId: string): Promise<TeamPermissions> {
  const payload = await getPayload({ config })
  const team = await payload.findByID({ collection: 'teams', id: teamId }).catch(() => null)
  if (!team) return NO_PERMISSIONS
  return getTeamPermissionsForUser(payload, teamId, team.workspace, userId)
}

export interface TeamPermissions {
  canManageLists: boolean
  canManageCalendar: boolean
  canManageMembers: boolean
  canManageTeamSettings: boolean
}
