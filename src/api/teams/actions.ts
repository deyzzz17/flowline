'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { ok, err } from '@/types/result'
import { getSession } from '@/lib/get-session'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { getWorkspaceOwnerId } from '@/api/workspaces/actions'
import { getWorkspaceRoleForUser, getEffectiveWorkspacePermissions } from '@/lib/get-current-workspace'
import { findUsersByIds } from '@/api/contacts/actions'
import type { Plan } from '@/lib/stripe'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

const getActiveWorkspaceId = async () => {
  const session = await getSession()
  return session?.session.activeOrganizationId ?? null
}

export interface TeamsAccess {
  /** `null` outside a real workspace — Teams don't exist in Personal. */
  ownerPlan: Plan | null
  hasAccess: boolean
}

// Teams are a Pro-only feature (unlimited once you have access, not a
// numeric cap) — gated by the WORKSPACE OWNER's plan, same as every other
// workspace-quota check in this app, not whoever happens to be looking.
export const getTeamsAccess = async (): Promise<TeamsAccess> => {
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return { ownerPlan: null, hasAccess: false }

  const ownerId = await getWorkspaceOwnerId(workspaceId)
  if (!ownerId) return { ownerPlan: null, hasAccess: false }

  const { plan, limits } = await getPlanLimitsForUserId(ownerId)
  return { ownerPlan: plan, hasAccess: limits.teams > 0 }
}

async function assertTeamAccess(workspaceId: string) {
  const ownerId = await getWorkspaceOwnerId(workspaceId)
  if (!ownerId) return false
  const { limits } = await getPlanLimitsForUserId(ownerId)
  return limits.teams > 0
}

export interface TeamSummary {
  id: number
  name: string
  memberCount: number
}

export const listTeams = async (): Promise<TeamSummary[]> => {
  const userId = await getUserId()
  if (!userId) return []
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return []
  if (!(await getWorkspaceRoleForUser(workspaceId, userId))) return []
  if (!(await assertTeamAccess(workspaceId))) return []

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'teams',
    where: { and: [{ workspace: { equals: workspaceId } }, { planArchivedAt: { exists: false } }] },
    sort: 'name',
    limit: 0,
  })

  const counts = await Promise.all(
    docs.map((t) =>
      payload.count({ collection: 'team-members', where: { team: { equals: t.id } } }),
    ),
  )

  return docs.map((t, i) => ({ id: t.id, name: t.name, memberCount: counts[i].totalDocs }))
}

async function canManageTeam(
  payload: Awaited<ReturnType<typeof getPayload>>,
  teamId: number,
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const role = await getWorkspaceRoleForUser(workspaceId, userId)
  if (role === 'owner' || role === 'admin') return true
  const team = await payload.findByID({ collection: 'teams', id: teamId }).catch(() => null)
  return !!team && team.createdBy === userId
}

export interface CreateTeamMemberInput {
  userId: string
  roleName: string
}

export interface CreateTeamInput {
  name: string
  members: CreateTeamMemberInput[]
}

export const createTeam = async (input: CreateTeamInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return err('No active workspace')
    if (!(await assertTeamAccess(workspaceId))) return err('TEAMS_REQUIRE_PRO')

    const permissions = await getEffectiveWorkspacePermissions(workspaceId, userId)
    if (!permissions.canModifyContent) return err('Not authorized')

    const name = input.name.trim()
    if (!name) return err('Name is required')

    const payload = await getPayload({ config })

    const { totalDocs: dupeCount } = await payload.find({
      collection: 'teams',
      where: { and: [{ workspace: { equals: workspaceId } }, { name: { equals: name } }] },
      limit: 0,
    })
    if (dupeCount > 0) return err('A team with this name already exists')

    // Every member must actually belong to this workspace.
    const memberIds = [...new Set(input.members.map((m) => m.userId))]
    for (const id of memberIds) {
      if (!(await getWorkspaceRoleForUser(workspaceId, id))) {
        return err('One of the selected members is not part of this workspace')
      }
    }

    const team = await payload.create({
      collection: 'teams',
      data: { workspace: workspaceId, name, createdBy: userId },
    })

    const roleNames = [...new Set(input.members.map((m) => m.roleName.trim()).filter(Boolean))]
    const roleIdByName = new Map<string, number>()
    for (const roleName of roleNames) {
      const role = await payload.create({
        collection: 'team-roles',
        data: { team: team.id, name: roleName },
      })
      roleIdByName.set(roleName, role.id)
    }

    for (const member of input.members) {
      const roleId = roleIdByName.get(member.roleName.trim())
      if (!roleId) continue
      await payload.create({
        collection: 'team-members',
        data: { team: team.id, userId: member.userId, teamRole: roleId, addedBy: userId },
      })
    }

    revalidatePath('/')
    return ok({ id: team.id, name: team.name })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error creating team'
    return err(message)
  }
}

export interface TeamOverview {
  id: number
  name: string
  memberCount: number
  lists: { id: number; name: string; slug: string; taskCount: number }[]
  calendarCategories: { id: number; name: string; color: string }[]
  members: { id: number; userId: string; name: string; image: string | null; roleName: string }[]
}

export const getTeamOverview = async (teamId: number): Promise<TeamOverview | null> => {
  const userId = await getUserId()
  if (!userId) return null
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return null

  const payload = await getPayload({ config })
  const team = await payload.findByID({ collection: 'teams', id: teamId }).catch(() => null)
  if (!team || team.workspace !== workspaceId || team.planArchivedAt) return null
  if (!(await getWorkspaceRoleForUser(workspaceId, userId))) return null

  const [{ docs: lists }, { docs: categories }, { docs: memberDocs }] = await Promise.all([
    payload.find({
      collection: 'lists',
      where: { and: [{ team: { equals: teamId } }, { planArchivedAt: { exists: false } }] },
      sort: 'name',
      limit: 0,
    }),
    payload.find({
      collection: 'calendar-categories',
      where: { and: [{ team: { equals: teamId } }, { planArchivedAt: { exists: false } }] },
      sort: 'name',
      limit: 0,
    }),
    payload.find({
      collection: 'team-members',
      where: { team: { equals: teamId } },
      limit: 0,
      depth: 1,
    }),
  ])

  const taskCounts = await Promise.all(
    lists.map((l) =>
      payload.count({
        collection: 'tasks',
        where: { and: [{ list: { equals: l.id } }, { status: { not_equals: 'deleted' } }] },
      }),
    ),
  )

  const profiles = await findUsersByIds(memberDocs.map((m) => m.userId as string))
  const members = memberDocs
    .map((m) => {
      const profile = profiles.get(m.userId as string)
      if (!profile) return null
      const role = typeof m.teamRole === 'object' ? m.teamRole : null
      return {
        id: m.id,
        userId: m.userId as string,
        name: profile.name,
        image: profile.image,
        roleName: role?.name ?? 'Member',
      }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  return {
    id: team.id,
    name: team.name,
    memberCount: members.length,
    lists: lists.map((l, i) => ({
      id: l.id,
      name: l.name,
      slug: l.slug ?? '',
      taskCount: taskCounts[i].totalDocs,
    })),
    calendarCategories: categories.map((c) => ({ id: c.id, name: c.name, color: c.color })),
    members,
  }
}

export const listTeamRoles = async (teamId: number) => {
  const userId = await getUserId()
  if (!userId) return []
  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return []

  const payload = await getPayload({ config })
  const team = await payload.findByID({ collection: 'teams', id: teamId }).catch(() => null)
  if (!team || team.workspace !== workspaceId) return []
  if (!(await getWorkspaceRoleForUser(workspaceId, userId))) return []

  const { docs } = await payload.find({
    collection: 'team-roles',
    where: { team: { equals: teamId } },
    sort: 'name',
    limit: 0,
  })
  return docs.map((r) => ({ id: r.id, name: r.name }))
}

export const createTeamRole = async (teamId: number, name: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return err('No active workspace')

    const payload = await getPayload({ config })
    if (!(await canManageTeam(payload, teamId, workspaceId, userId))) return err('Not authorized')

    const trimmed = name.trim()
    if (!trimmed) return err('Name is required')

    const { totalDocs: dupeCount } = await payload.find({
      collection: 'team-roles',
      where: { and: [{ team: { equals: teamId } }, { name: { equals: trimmed } }] },
      limit: 0,
    })
    if (dupeCount > 0) return err('A role with this name already exists on this team')

    const role = await payload.create({
      collection: 'team-roles',
      data: { team: teamId, name: trimmed },
    })

    revalidatePath('/')
    return ok({ id: role.id, name: role.name })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error creating role'
    return err(message)
  }
}

export const deleteTeamRole = async (teamId: number, roleId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return err('No active workspace')

    const payload = await getPayload({ config })
    if (!(await canManageTeam(payload, teamId, workspaceId, userId))) return err('Not authorized')

    const { totalDocs: inUse } = await payload.find({
      collection: 'team-members',
      where: { and: [{ team: { equals: teamId } }, { teamRole: { equals: roleId } }] },
      limit: 0,
    })
    if (inUse > 0) {
      return err('Reassign the members using this role before deleting it')
    }

    await payload.delete({ collection: 'team-roles', id: roleId })
    revalidatePath('/')
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error deleting role'
    return err(message)
  }
}

export const addTeamMember = async (teamId: number, targetUserId: string, roleId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return err('No active workspace')

    const payload = await getPayload({ config })
    if (!(await canManageTeam(payload, teamId, workspaceId, userId))) return err('Not authorized')
    if (!(await getWorkspaceRoleForUser(workspaceId, targetUserId))) {
      return err('This person is not part of this workspace')
    }

    const role = await payload.findByID({ collection: 'team-roles', id: roleId }).catch(() => null)
    const roleTeamId = typeof role?.team === 'object' ? role?.team.id : role?.team
    if (!role || roleTeamId !== teamId) return err('Role not found')

    const { totalDocs: already } = await payload.find({
      collection: 'team-members',
      where: { and: [{ team: { equals: teamId } }, { userId: { equals: targetUserId } }] },
      limit: 0,
    })
    if (already > 0) return err('This person is already on the team')

    await payload.create({
      collection: 'team-members',
      data: { team: teamId, userId: targetUserId, teamRole: roleId, addedBy: userId },
    })

    revalidatePath('/')
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error adding member'
    return err(message)
  }
}

export const updateTeamMemberRole = async (teamMemberId: number, roleId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return err('No active workspace')

    const payload = await getPayload({ config })
    const member = await payload.findByID({ collection: 'team-members', id: teamMemberId }).catch(() => null)
    if (!member) return err('Member not found')
    const memberTeamId = typeof member.team === 'object' ? member.team.id : member.team
    if (!memberTeamId || !(await canManageTeam(payload, memberTeamId, workspaceId, userId))) {
      return err('Not authorized')
    }

    const role = await payload.findByID({ collection: 'team-roles', id: roleId }).catch(() => null)
    const roleTeamId = typeof role?.team === 'object' ? role?.team.id : role?.team
    if (!role || roleTeamId !== memberTeamId) return err('Role not found')

    await payload.update({ collection: 'team-members', id: teamMemberId, data: { teamRole: roleId } })
    revalidatePath('/')
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error updating member'
    return err(message)
  }
}

export const removeTeamMember = async (teamMemberId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const workspaceId = await getActiveWorkspaceId()
    if (!workspaceId) return err('No active workspace')

    const payload = await getPayload({ config })
    const member = await payload.findByID({ collection: 'team-members', id: teamMemberId }).catch(() => null)
    if (!member) return err('Member not found')
    const memberTeamId = typeof member.team === 'object' ? member.team.id : member.team
    if (!memberTeamId || !(await canManageTeam(payload, memberTeamId, workspaceId, userId))) {
      return err('Not authorized')
    }

    await payload.delete({ collection: 'team-members', id: teamMemberId })
    revalidatePath('/')
    return ok(true)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error removing member'
    return err(message)
  }
}
