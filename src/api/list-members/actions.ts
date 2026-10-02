'use server'

import 'server-only'

import { getPayload, type Where } from 'payload'
import { pool } from '@/lib/db-pool'
import config from '@/payload.config'
import { cacheForUser } from '@/lib/server-cache'
import { revalidatePath } from 'next/cache'
import { ok, err } from '@/types/result'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/get-session'
import {
  getCurrentWorkspaceId,
  getWorkspaceRoleForUser,
  getWorkspaceNicknames,
  applyWorkspaceNicknames,
  workspaceWhereClause,
} from '@/lib/get-current-workspace'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'
import { resolveListRole, getListMemberIds, canViewList } from '@/lib/list-roles'
import type { WorkspaceRole } from '@/lib/workspace-permissions'
import { type ContactProfile } from '@/api/contacts/actions'
import { findUsersByIds } from '@/api/contacts/internal'
import { sendListInviteEmail } from '@/lib/notification-emails'
import type { List } from '@/payload-types'
import { countSharedLists } from './internal'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export type ListMemberRole = 'editor' | 'reader'

// Inside a workspace, a member added to a list starts as editor — or reader
// for a workspace Viewer. The list admin can then switch a Member between
// editor and reader (changeListMemberRole). Two cases stay fixed, enforced
// live by resolveListRole(): a Viewer is always read-only, and the workspace
// owner/admins manage every shared list anyway.
function deriveListRoleFromWorkspaceRole(role: WorkspaceRole): ListMemberRole {
  return role === 'viewer' ? 'reader' : 'editor'
}

/** Why a workspace list member's role can't be changed on the list, if so. */
export type ListRoleLock = 'workspace-viewer' | 'workspace-admin'

function listRoleLockFor(role: WorkspaceRole): ListRoleLock | null {
  if (role === 'viewer') return 'workspace-viewer'
  if (role === 'owner' || role === 'admin') return 'workspace-admin'
  return null
}

export interface ListMemberEntry {
  id: number
  role: ListMemberRole
  /** Set when the role follows the workspace and can't be changed here. */
  roleLock: ListRoleLock | null
  status: 'pending' | 'accepted'
  user: ContactProfile
  invitedAt: string
  respondedAt: string | null
}

export interface ListMembersOverview {
  /** The list's creator: always on it, with every right — not a member row. */
  creator: ContactProfile | null
  /** The caller, so the UI never offers to add themselves. */
  viewerId: string
  members: ListMemberEntry[]
}

export interface ListInvite {
  id: number
  role: ListMemberRole
  invitedAt: string
  list: { id: number; name: string; slug: string; color: string | null }
  invitedBy: ContactProfile | null
}

export interface SharedWithMeList extends List {
  myRole: ListMemberRole
}

async function getAcceptedContactIds(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: string,
): Promise<string[]> {
  const { docs } = await payload.find({
    collection: 'connections',
    where: {
      and: [
        { status: { equals: 'accepted' } },
        { or: [{ requesterId: { equals: userId } }, { recipientId: { equals: userId } }] },
      ],
    },
    limit: 0,
  })
  return docs.map((d) =>
    d.requesterId === userId ? (d.recipientId as string) : (d.requesterId as string),
  )
}

// Every user id with an ACCEPTED membership in this Better Auth organization,
// mapped to their workspace role (pending invites don't count — you can't add
// someone to a list who hasn't actually joined the workspace yet).
async function getWorkspaceMemberRoles(workspaceId: string): Promise<Map<string, WorkspaceRole>> {
  const result = await pool.query(`SELECT "userId", role FROM member WHERE "organizationId" = $1`, [
    workspaceId,
  ])
  const map = new Map<string, WorkspaceRole>()
  for (const row of result.rows) {
    const role =
      row.role === 'owner' || row.role === 'admin' || row.role === 'member' || row.role === 'viewer'
        ? row.role
        : null
    map.set(row.userId, role)
  }
  return map
}

async function countListMembers(
  payload: Awaited<ReturnType<typeof getPayload>>,
  listId: number,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'list-members',
    where: {
      and: [{ list: { equals: listId } }, { status: { in: ['pending', 'accepted'] } }],
    },
    limit: 0,
  })
  return totalDocs
}

export type CreateSharedListInput = {
  name: string
  category?: { name?: string; color?: string }
  invites: { userId: string; role: ListMemberRole }[]
}

export const createSharedList = async (input: CreateSharedListInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`create-shared-list:${userId}`, 1, 1000)) {
      return err('Too many requests. Please wait a moment.')
    }

    const payload = await getPayload({ config })
    const { plan, limits } = await getPlanLimitsForUserId(userId)

    const sharedListCount = await countSharedLists(payload, userId)
    if (isAtLimit(sharedListCount, limits.sharedLists)) {
      return err(
        isPlanUnlimited(plan, 'sharedLists')
          ? SAFETY_CAP_ERRORS.SHARED_LISTS_CAP
          : LIMIT_ERRORS.SHARED_LISTS_LIMIT,
      )
    }

    const uniqueInvites = Array.from(
      new Map(input.invites.map((i) => [i.userId, i])).values(),
    ).filter((i) => i.userId !== userId)

    if (uniqueInvites.length > limits.sharedListMembers) {
      return err(
        isPlanUnlimited(plan, 'sharedListMembers')
          ? SAFETY_CAP_ERRORS.SHARED_LIST_MEMBERS_CAP
          : LIMIT_ERRORS.SHARED_LIST_MEMBERS_LIMIT,
      )
    }

    const workspaceId = await getCurrentWorkspaceId()

    if (uniqueInvites.length > 0) {
      if (workspaceId !== null) {
        // Inside a workspace, you can only add actual (accepted) members of
        // that workspace — not your personal contacts, and not people who
        // were invited to the workspace but haven't accepted yet. Their list
        // role is no longer picked manually here either — it always mirrors
        // their workspace role, so whatever role the client sent is ignored.
        const memberRoles = await getWorkspaceMemberRoles(workspaceId)
        const invalidInvite = uniqueInvites.find((i) => !memberRoles.has(i.userId))
        if (invalidInvite) {
          return err('You can only add members of this workspace.')
        }
        for (const invite of uniqueInvites) {
          invite.role = deriveListRoleFromWorkspaceRole(memberRoles.get(invite.userId) ?? null)
        }
      } else {
        const acceptedContactIds = await getAcceptedContactIds(payload, userId)
        const invalidInvite = uniqueInvites.find((i) => !acceptedContactIds.includes(i.userId))
        if (invalidInvite) {
          return err('You can only invite people from your contacts.')
        }
      }
    }

    const { docs: existing } = await payload.find({
      collection: 'lists',
      where: {
        and: [workspaceWhereClause(workspaceId), { name: { equals: input.name.trim() } }],
      },
      limit: 1,
    })
    if (existing.length > 0) {
      return err(existing[0].planArchivedAt ? 'DUPLICATE_NAME_ARCHIVED' : 'DUPLICATE_NAME')
    }

    const list = await payload.create({
      collection: 'lists',
      data: {
        name: input.name.trim(),
        userId,
        workspace: workspaceId,
        ...(input.category && { category: input.category }),
        isDefault: false,
        isShared: uniqueInvites.length > 0,
      },
    })

    // Workspace teammates are already trusted members of the org, so adding
    // them to a list is immediate — no separate pending/accept step, unlike
    // Personal contacts (who aren't otherwise connected to this resource).
    const initialStatus = workspaceId !== null ? 'accepted' : 'pending'
    for (const invite of uniqueInvites) {
      await payload.create({
        collection: 'list-members',
        data: {
          list: list.id,
          userId: invite.userId,
          invitedBy: userId,
          role: invite.role,
          status: initialStatus,
          ...(initialStatus === 'accepted' && { respondedAt: new Date().toISOString() }),
        },
      })
    }

    if (uniqueInvites.length > 0) {
      const profiles = await findUsersByIds([userId, ...uniqueInvites.map((i) => i.userId)])
      const inviterName = profiles.get(userId)?.name ?? 'Someone'
      for (const invite of uniqueInvites) {
        const invitee = profiles.get(invite.userId)
        if (invitee) await sendListInviteEmail(invitee.email, list.name, inviterName)
      }
    }

    return ok(list)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error creating the shared list'
    return err(message)
  }
}

export const inviteListMember = async (
  listId: number,
  inviteeUserId: string,
  role: ListMemberRole,
) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`invite-list-member:${userId}`, 5, 1000)) {
      return err('Too many requests. Please wait a moment.')
    }

    const payload = await getPayload({ config })
    const list = await payload.findByID({ collection: 'lists', id: listId }).catch(() => null)
    if (!list) return err('List not found')

    const callerRole = await resolveListRole(payload, listId, userId)
    if (callerRole !== 'admin') return err('Not authorized')

    if (inviteeUserId === userId) return err('You cannot invite yourself.')
    if (inviteeUserId === list.userId) return err('The list creator is already on this list.')

    const listWorkspaceId = (list as any).workspace ?? null
    // Inside a workspace, the invitee's list role is no longer picked
    // manually — it always mirrors their workspace role, so the caller-
    // supplied `role` argument is only honored for Personal lists.
    let effectiveRole = role
    if (listWorkspaceId !== null) {
      const workspaceRole = await getWorkspaceRoleForUser(listWorkspaceId, inviteeUserId)
      if (!workspaceRole) {
        return err('You can only add members of this workspace.')
      }
      effectiveRole = deriveListRoleFromWorkspaceRole(workspaceRole)
    } else {
      const acceptedContactIds = await getAcceptedContactIds(payload, userId)
      if (!acceptedContactIds.includes(inviteeUserId)) {
        return err('You can only invite people from your contacts.')
      }
    }

    const { plan, limits } = await getPlanLimitsForUserId(userId)

    if (!list.isShared) {
      const sharedListCount = await countSharedLists(payload, userId)
      if (isAtLimit(sharedListCount, limits.sharedLists)) {
        return err(
          isPlanUnlimited(plan, 'sharedLists')
            ? SAFETY_CAP_ERRORS.SHARED_LISTS_CAP
            : LIMIT_ERRORS.SHARED_LISTS_LIMIT,
        )
      }
    }

    const memberCount = await countListMembers(payload, listId)
    if (isAtLimit(memberCount, limits.sharedListMembers)) {
      return err(
        isPlanUnlimited(plan, 'sharedListMembers')
          ? SAFETY_CAP_ERRORS.SHARED_LIST_MEMBERS_CAP
          : LIMIT_ERRORS.SHARED_LIST_MEMBERS_LIMIT,
      )
    }

    const initialStatus = listWorkspaceId !== null ? 'accepted' : 'pending'
    const created = await payload.create({
      collection: 'list-members',
      data: {
        list: listId,
        userId: inviteeUserId,
        invitedBy: userId,
        role: effectiveRole,
        status: initialStatus,
        ...(initialStatus === 'accepted' && { respondedAt: new Date().toISOString() }),
      },
    })

    if (!list.isShared) {
      await payload.update({ collection: 'lists', id: listId, data: { isShared: true } })
    }

    const profiles = await findUsersByIds([userId, inviteeUserId])
    const invitee = profiles.get(inviteeUserId)
    const inviter = profiles.get(userId)
    if (invitee && inviter) {
      await sendListInviteEmail(invitee.email, list.name, inviter.name ?? 'Someone')
    }

    return ok(created)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error inviting member'
    return err(message)
  }
}

export const acceptListInvite = async (memberId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const member = await payload
      .findByID({ collection: 'list-members', id: memberId })
      .catch(() => null)

    if (!member || member.userId !== userId) return err('Not authorized')
    if (member.status !== 'pending') return err('This invite is no longer pending')

    const listId = typeof member.list === 'object' ? member.list.id : member.list
    const list = await payload.findByID({ collection: 'lists', id: listId })

    const { plan, limits } = await getPlanLimitsForUserId(list.userId)
    const memberCount = await countListMembers(payload, listId)
    if (isAtLimit(memberCount, limits.sharedListMembers)) {
      return err(
        isPlanUnlimited(plan, 'sharedListMembers')
          ? SAFETY_CAP_ERRORS.SHARED_LIST_MEMBERS_CAP
          : LIMIT_ERRORS.SHARED_LIST_MEMBERS_LIMIT,
      )
    }

    const updated = await payload.update({
      collection: 'list-members',
      id: memberId,
      data: { status: 'accepted', respondedAt: new Date().toISOString() },
    })

    return ok(updated)
  } catch {
    return err('Error accepting invite')
  }
}

export const declineListInvite = async (memberId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const member = await payload
      .findByID({ collection: 'list-members', id: memberId })
      .catch(() => null)

    if (!member || member.userId !== userId) return err('Not authorized')
    if (member.status !== 'pending') return err('This invite is no longer pending')

    await payload.delete({ collection: 'list-members', id: memberId })

    return ok(true)
  } catch {
    return err('Error declining invite')
  }
}

export const removeListMember = async (listId: number, memberId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const role = await resolveListRole(payload, listId, userId)
    if (role !== 'admin') return err('Not authorized')

    const member = await payload
      .findByID({ collection: 'list-members', id: memberId })
      .catch(() => null)
    if (!member) return err('Member not found')
    const memberListId = typeof member.list === 'object' ? member.list.id : member.list
    if (memberListId !== listId) return err('Not authorized')

    await payload.delete({ collection: 'list-members', id: memberId })

    return ok(true)
  } catch {
    return err('Error removing member')
  }
}

export const changeListMemberRole = async (
  listId: number,
  memberId: number,
  role: ListMemberRole,
) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const callerRole = await resolveListRole(payload, listId, userId)
    if (callerRole !== 'admin') return err('Not authorized')

    const list = await payload.findByID({ collection: 'lists', id: listId }).catch(() => null)
    if (!list) return err('List not found')
    if (role !== 'editor' && role !== 'reader') return err('Invalid role')

    const member = await payload
      .findByID({ collection: 'list-members', id: memberId })
      .catch(() => null)
    if (!member) return err('Member not found')
    const memberListId = typeof member.list === 'object' ? member.list.id : member.list
    if (memberListId !== listId) return err('Not authorized')

    // Inside a workspace, a Member can be switched between editor and
    // reader; a Viewer's (read-only) and an owner/admin's (full access)
    // follow the workspace.
    const listWorkspaceId = (list as any).workspace ?? null
    if (listWorkspaceId) {
      const lock = listRoleLockFor(
        await getWorkspaceRoleForUser(listWorkspaceId, member.userId as string),
      )
      if (lock === 'workspace-viewer') {
        return err('Workspace viewers are always read-only on lists.')
      }
      if (lock === 'workspace-admin') {
        return err('Workspace owners and admins can manage every shared list.')
      }
    }

    const updated = await payload.update({
      collection: 'list-members',
      id: memberId,
      data: { role },
    })

    return ok(updated)
  } catch {
    return err('Error changing member role')
  }
}

export const listMembersForList = async (listId: number): Promise<ListMembersOverview> => {
  const userId = await getUserId()
  const empty: ListMembersOverview = { creator: null, viewerId: userId ?? '', members: [] }
  if (!userId) return empty

  const payload = await getPayload({ config })
  const role = await resolveListRole(payload, listId, userId)
  if (role !== 'admin') return empty

  const list = await payload.findByID({ collection: 'lists', id: listId }).catch(() => null)
  if (!list) return empty
  const listWorkspaceId = (list as any)?.workspace ?? null
  const creatorId = list.userId as string

  const { docs: rows } = await payload.find({
    collection: 'list-members',
    where: { list: { equals: listId } },
    sort: 'createdAt',
    limit: 0,
  })
  // The creator is shown on their own, never as a regular member.
  const docs = rows.filter((d) => d.userId !== creatorId)

  const usersMap = await findUsersByIds([creatorId, ...docs.map((d) => d.userId as string)])

  // Inside a workspace, always show the role currently derived from each
  // member's workspace role rather than the (possibly stale) value stored on
  // the list-members row — resolveListRole() enforces the same live value.
  const workspaceRoles = listWorkspaceId
    ? await getWorkspaceMemberRoles(listWorkspaceId)
    : new Map<string, WorkspaceRole>()

  // A workspace list's members are shown by whatever nickname they set on
  // the workspace's Members page, not their global account name.
  const nicknames = listWorkspaceId
    ? await getWorkspaceNicknames(listWorkspaceId)
    : new Map<string, string>()

  const rawCreator = usersMap.get(creatorId)
  const creator = rawCreator ? applyWorkspaceNicknames([rawCreator], nicknames)[0] : null

  const members = docs
    .map((d) => {
      const rawUser = usersMap.get(d.userId as string)
      if (!rawUser) return null
      const user = applyWorkspaceNicknames([rawUser], nicknames)[0]
      const roleLock = listWorkspaceId
        ? listRoleLockFor(workspaceRoles.get(d.userId as string) ?? null)
        : null
      const displayRole: ListMemberRole =
        roleLock === 'workspace-viewer' ? 'reader' : d.role === 'reader' ? 'reader' : 'editor'
      return {
        id: d.id,
        role: displayRole,
        roleLock,
        status: d.status as 'pending' | 'accepted',
        user,
        invitedAt: d.createdAt as string,
        respondedAt: d.respondedAt as string | null,
      }
    })
    .filter((x): x is ListMemberEntry => x !== null)

  return { creator, viewerId: userId, members }
}

export const listMemberProfiles = async (listId: number): Promise<ContactProfile[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })
  const role = await resolveListRole(payload, listId, userId)
  if (!canViewList(role)) return []

  const list = await payload.findByID({ collection: 'lists', id: listId }).catch(() => null)
  const listWorkspaceId = (list as any)?.workspace ?? null

  const memberIds = await getListMemberIds(payload, listId)
  const usersMap = await findUsersByIds(memberIds)
  const profiles = memberIds
    .map((id) => usersMap.get(id))
    .filter((u): u is ContactProfile => u !== undefined)

  // Assignee pickers, @mentions, and anywhere else this feeds into should
  // show each workspace member's nickname rather than their account name.
  const nicknames = listWorkspaceId
    ? await getWorkspaceNicknames(listWorkspaceId)
    : new Map<string, string>()

  return applyWorkspaceNicknames(profiles, nicknames)
}

export const listMyListInvites = async (): Promise<ListInvite[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'list-members',
    where: { and: [{ userId: { equals: userId } }, { status: { equals: 'pending' } }] },
    sort: '-createdAt',
    limit: 0,
  })

  if (docs.length === 0) return []

  const inviterIds = docs.map((d) => d.invitedBy as string)
  const invitersMap = await findUsersByIds(inviterIds)

  const invites: ListInvite[] = []
  for (const d of docs) {
    const listId = typeof d.list === 'object' ? d.list?.id : d.list
    if (!listId) continue
    const list = await payload.findByID({ collection: 'lists', id: listId }).catch(() => null)
    if (!list) continue

    invites.push({
      id: d.id,
      role: d.role as ListMemberRole,
      invitedAt: d.createdAt as string,
      list: {
        id: list.id,
        name: list.name,
        slug: list.slug ?? '',
        color: list.category?.color ?? null,
      },
      invitedBy: invitersMap.get(d.invitedBy as string) ?? null,
    })
  }

  return invites
}

export const listListsSharedWithMe = async (): Promise<SharedWithMeList[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'list-members',
    where: { and: [{ userId: { equals: userId } }, { status: { equals: 'accepted' } }] },
    limit: 0,
  })

  if (docs.length === 0) return []

  const result: SharedWithMeList[] = []
  for (const d of docs) {
    const listId = typeof d.list === 'object' ? d.list?.id : d.list
    if (!listId) continue
    const list = await payload.findByID({ collection: 'lists', id: listId }).catch(() => null)
    if (!list || list.planArchivedAt) continue
    result.push({ ...list, myRole: d.role as ListMemberRole })
  }

  return result
}

// Checked by the app layout on every full render — cached per user (dropped on plan changes and when the relevant documents change, see server-cache.ts).
export const checkSharedListsCompliance = async () => {
  const userId = await getUserId()
  if (!userId) return computeCheckSharedListsCompliance(null)
  return cacheForUser(userId, ['compliance'], ['shared-lists-compliance'], () =>
    computeCheckSharedListsCompliance(userId),
  )
}

async function computeCheckSharedListsCompliance(userId: string | null) {
  if (!userId) return null

  const { limits } = await getPlanLimitsForUserId(userId)
  if (limits.sharedLists === Infinity) return null

  const payload = await getPayload({ config })
  const where: Where = {
    and: [
      { userId: { equals: userId } },
      { isShared: { equals: true } },
      { planArchivedAt: { exists: false } },
    ],
  }
  // Runs from the app layout on every full render — a cheap COUNT first;
  // the documents themselves are only needed in the rare over-limit case.
  const { totalDocs } = await payload.count({ collection: 'lists', where })
  if (totalDocs <= limits.sharedLists) return null

  const { docs: activeSharedLists } = await payload.find({
    collection: 'lists',
    sort: 'createdAt',
    limit: 0,
    pagination: false,
    where,
  })

  return {
    overBy: totalDocs - limits.sharedLists,
    limit: limits.sharedLists,
    lists: activeSharedLists,
  }
}

export const chooseSharedListsToKeep = async (keepIds: number[]) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const { limits } = await getPlanLimitsForUserId(userId)

    if (keepIds.length > limits.sharedLists) {
      return err('TOO_MANY_SELECTED')
    }

    const { docs: activeSharedLists } = await payload.find({
      collection: 'lists',
      where: {
        and: [
          { userId: { equals: userId } },
          { isShared: { equals: true } },
          { planArchivedAt: { exists: false } },
        ],
      },
      limit: 0,
    })

    const keepSet = new Set(keepIds)
    const toArchive = activeSharedLists.filter((l) => !keepSet.has(l.id))

    const now = new Date().toISOString()
    for (const list of toArchive) {
      if (list.userId !== userId) continue

      await payload.update({
        collection: 'lists',
        id: list.id,
        data: { planArchivedAt: now },
      })

      const { docs: tasks } = await payload.find({
        collection: 'tasks',
        where: { list: { equals: list.id } },
        limit: 0,
      })
      for (const task of tasks) {
        await payload.update({
          collection: 'tasks',
          id: task.id,
          data: { planArchivedAt: now } as any,
        })
      }
    }

    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while archiving shared lists')
  }
}

// Scoped to the active workspace — same reasoning as listPlanArchivedLists:
// an archived shared list must only be offered for restore under the
// workspace it actually belonged to.
export const listPlanArchivedSharedLists = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  const workspaceId = await getCurrentWorkspaceId()

  return await payload.find({
    collection: 'lists',
    sort: '-planArchivedAt',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { isShared: { equals: true } },
        { planArchivedAt: { exists: true } },
        workspaceWhereClause(workspaceId),
      ],
    },
  })
}

export const restoreArchivedSharedList = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const list = await payload.findByID({ collection: 'lists', id })
    if (!list || list.userId !== userId) return err('Not authorized')
    if (!list.planArchivedAt) return err('List is not archived')
    if (!list.isShared) return err('This is not a shared list')

    // Same rule as restoreArchivedList: only restorable into the workspace
    // it was actually archived from.
    const workspaceId = await getCurrentWorkspaceId()
    if ((list.workspace ?? null) !== workspaceId) return err('Not authorized')

    const { limits } = await getPlanLimitsForUserId(userId)
    const currentCount = await countSharedLists(payload, userId)

    if (isAtLimit(currentCount, limits.sharedLists)) {
      return err('LIMIT_FULL')
    }

    await payload.update({
      collection: 'lists',
      id,
      data: { planArchivedAt: null },
    })

    const { docs: tasks } = await payload.find({
      collection: 'tasks',
      where: { list: { equals: id } },
      limit: 0,
    })
    for (const task of tasks) {
      await payload.update({
        collection: 'tasks',
        id: task.id,
        data: { planArchivedAt: null } as any,
      })
    }

    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while restoring the shared list')
  }
}
