'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { ok, err } from '@/types/result'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/get-session'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'
import { resolveListRole } from '@/lib/list-roles'
import { findUsersByIds, type ContactProfile } from '@/api/contacts/actions'
import type { List } from '@/payload-types'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export type ListMemberRole = 'editor' | 'reader'

export interface ListMemberEntry {
  id: number
  role: ListMemberRole
  status: 'pending' | 'accepted'
  user: ContactProfile
  invitedAt: string
  respondedAt: string | null
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

async function countSharedLists(
  payload: Awaited<ReturnType<typeof getPayload>>,
  ownerId: string,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'lists',
    where: {
      and: [{ userId: { equals: ownerId } }, { isShared: { equals: true } }],
    },
    limit: 0,
  })
  return totalDocs
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

    const acceptedContactIds = await getAcceptedContactIds(payload, userId)
    if (!acceptedContactIds.includes(inviteeUserId)) {
      return err('You can only invite people from your contacts.')
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

    const created = await payload.create({
      collection: 'list-members',
      data: {
        list: listId,
        userId: inviteeUserId,
        invitedBy: userId,
        role,
        status: 'pending',
      },
    })

    if (!list.isShared) {
      await payload.update({ collection: 'lists', id: listId, data: { isShared: true } })
    }

    revalidatePath('/')
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

    revalidatePath('/')
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

    revalidatePath('/')
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

    revalidatePath('/')
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

    const member = await payload
      .findByID({ collection: 'list-members', id: memberId })
      .catch(() => null)
    if (!member) return err('Member not found')
    const memberListId = typeof member.list === 'object' ? member.list.id : member.list
    if (memberListId !== listId) return err('Not authorized')

    const updated = await payload.update({
      collection: 'list-members',
      id: memberId,
      data: { role },
    })

    revalidatePath('/')
    return ok(updated)
  } catch {
    return err('Error changing member role')
  }
}

export const listMembersForList = async (listId: number): Promise<ListMemberEntry[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })
  const role = await resolveListRole(payload, listId, userId)
  if (role !== 'admin') return []

  const { docs } = await payload.find({
    collection: 'list-members',
    where: { list: { equals: listId } },
    sort: 'createdAt',
    limit: 0,
  })

  if (docs.length === 0) return []

  const usersMap = await findUsersByIds(docs.map((d) => d.userId as string))

  return docs
    .map((d) => {
      const user = usersMap.get(d.userId as string)
      if (!user) return null
      return {
        id: d.id,
        role: d.role as ListMemberRole,
        status: d.status as 'pending' | 'accepted',
        user,
        invitedAt: d.createdAt as string,
        respondedAt: d.respondedAt as string | null,
      }
    })
    .filter((x): x is ListMemberEntry => x !== null)
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
