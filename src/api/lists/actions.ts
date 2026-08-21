'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { ok, err } from '@/types/result'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/get-session'
import { getUserPlanLimits, getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'
import { resolveListRole } from '@/lib/list-roles'

type CreateListInput = {
  name: string
  category?: {
    name?: string
    color?: string
  }
}

type EditListInput = {
  name?: string
  category?: {
    name?: string
    color?: string
  }
}

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

async function countActiveLists(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: string,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'lists',
    where: {
      and: [
        { userId: { equals: userId } },
        { planArchivedAt: { exists: false } },
        { isShared: { not_equals: true } },
      ],
    },
    limit: 0,
  })
  return totalDocs
}

export const createList = async (input: CreateListInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`create-list:${userId}`, 1, 1000)) {
      return err('Too many requests. Please wait a moment.')
    }

    const payload = await getPayload({ config })

    const { plan, limits } = await getUserPlanLimits()

    const totalDocs = await countActiveLists(payload, userId)

    if (isAtLimit(totalDocs, limits.lists)) {
      return err(
        isPlanUnlimited(plan, 'lists') ? SAFETY_CAP_ERRORS.LISTS_CAP : LIMIT_ERRORS.LISTS_LIMIT,
      )
    }

    const { docs: existing } = await payload.find({
      collection: 'lists',
      where: {
        and: [{ userId: { equals: userId } }, { name: { equals: input.name.trim() } }],
      },
      limit: 1,
    })

    if (existing.length > 0) {
      return err(existing[0].planArchivedAt ? 'DUPLICATE_NAME_ARCHIVED' : 'DUPLICATE_NAME')
    }

    const newList = await payload.create({
      collection: 'lists',
      data: {
        name: input.name,
        userId,
        ...(input.category && { category: input.category }),
        isDefault: false,
      },
    })

    revalidatePath('/')
    return ok(newList)
  } catch {
    return err('Error while creating the list')
  }
}

export const listLists = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })

  return await payload.find({
    collection: 'lists',
    sort: 'createdAt',
    limit: 0,
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
    },
  })
}

export const listPlanArchivedLists = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })

  return await payload.find({
    collection: 'lists',
    sort: '-planArchivedAt',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { planArchivedAt: { exists: true } },
        { isShared: { not_equals: true } },
      ],
    },
  })
}

export const checkListsCompliance = async () => {
  const userId = await getUserId()
  if (!userId) return null

  const payload = await getPayload({ config })
  const { limits } = await getUserPlanLimits()

  const { docs: activeLists, totalDocs } = await payload.find({
    collection: 'lists',
    sort: 'createdAt',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { planArchivedAt: { exists: false } },
        { isShared: { not_equals: true } },
      ],
    },
  })

  if (totalDocs <= limits.lists) return null

  return { overBy: totalDocs - limits.lists, limit: limits.lists, lists: activeLists }
}

export const chooseListsToKeep = async (keepIds: number[]) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const { limits } = await getUserPlanLimits()

    if (keepIds.length > limits.lists) {
      return err('TOO_MANY_SELECTED')
    }

    const { docs: activeLists } = await payload.find({
      collection: 'lists',
      where: {
        and: [
          { userId: { equals: userId } },
          { planArchivedAt: { exists: false } },
          { isShared: { not_equals: true } },
        ],
      },
      limit: 0,
    })

    const keepSet = new Set(keepIds)
    const toArchive = activeLists.filter((l) => !keepSet.has(l.id))

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
    return err('Error while archiving lists')
  }
}

export const restoreArchivedList = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const list = await payload.findByID({ collection: 'lists', id })
    if (!list || list.userId !== userId) return err('Not authorized')
    if (!list.planArchivedAt) return err('List is not archived')
    if (list.isShared) return err('This is a shared list')

    const { limits } = await getUserPlanLimits()
    const currentCount = await countActiveLists(payload, userId)

    if (isAtLimit(currentCount, limits.lists)) {
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
    return err('Error while restoring the list')
  }
}

export async function restoreAllArchivedListsForUserId(userId: string): Promise<void> {
  try {
    const payload = await getPayload({ config })
    const { limits } = await getPlanLimitsForUserId(userId)

    const activeCount = await countActiveLists(payload, userId)
    const room = limits.lists === Infinity ? Infinity : Math.max(0, limits.lists - activeCount)
    if (room <= 0) return

    const { docs: archived } = await payload.find({
      collection: 'lists',
      where: {
        and: [
          { userId: { equals: userId } },
          { planArchivedAt: { exists: true } },
          { isShared: { not_equals: true } },
        ],
      },
      sort: 'planArchivedAt',
      limit: room === Infinity ? 0 : room,
    })

    for (const list of archived) {
      await payload.update({
        collection: 'lists',
        id: list.id,
        data: { planArchivedAt: null },
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
          data: { planArchivedAt: null } as any,
        })
      }
    }
  } catch (e) {
    console.error('restoreAllArchivedListsForUserId error:', e)
  }
}

export const getListById = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const list = await payload.findByID({ collection: 'lists', id })

    const role = await resolveListRole(payload, id, userId)
    if (!role) return err('Not authorized')

    return ok(list)
  } catch {
    return err('List not found')
  }
}

export const editList = async (id: number, input: EditListInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const role = await resolveListRole(payload, id, userId)
    if (role !== 'admin') return err('Not authorized')

    if (input.name !== undefined) {
      const { docs: existing } = await payload.find({
        collection: 'lists',
        where: {
          and: [
            { userId: { equals: userId } },
            { name: { equals: input.name.trim() } },
            { id: { not_equals: id } },
          ],
        },
        limit: 1,
      })
      if (existing.length > 0) {
        return err(existing[0].planArchivedAt ? 'DUPLICATE_NAME_ARCHIVED' : 'DUPLICATE_NAME')
      }
    }

    const updatedList = await payload.update({
      collection: 'lists',
      id,
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.category !== undefined && { category: input.category }),
      },
    })

    revalidatePath('/')
    return ok(updatedList)
  } catch {
    return err('Error while editing the list')
  }
}

export const deleteList = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const list = await payload.findByID({ collection: 'lists', id })

    const role = await resolveListRole(payload, id, userId)
    if (role !== 'admin') return err('Not authorized')

    const { docs: tasks } = await payload.find({
      collection: 'tasks',
      where: { list: { equals: id } },
      limit: 0,
    })

    for (const task of tasks) {
      await payload.delete({ collection: 'tasks', id: task.id })
    }

    if (list.isShared) {
      const { docs: members } = await payload.find({
        collection: 'list-members',
        where: { list: { equals: id } },
        limit: 0,
      })
      for (const member of members) {
        await payload.delete({ collection: 'list-members', id: member.id })
      }
    }

    await payload.delete({ collection: 'lists', id })

    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while deleting the list')
  }
}

export const createDefaultList = async () => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const existing = await payload.find({
      collection: 'lists',
      where: {
        and: [{ userId: { equals: userId } }, { isDefault: { equals: true } }],
      },
      limit: 1,
    })

    let defaultList = existing.docs[0]

    if (!defaultList) {
      defaultList = await payload.create({
        collection: 'lists',
        data: {
          name: 'Todo',
          userId,
          isDefault: true,
          category: { name: 'Personal', color: '#8b5cf6' },
        },
      })
    }

    const { docs: unassignedTasks } = await payload.find({
      collection: 'tasks',
      where: {
        and: [{ userId: { equals: userId } }, { list: { exists: false } }],
      },
      limit: 0,
    })

    for (const task of unassignedTasks) {
      await payload.update({
        collection: 'tasks',
        id: task.id,
        data: { list: defaultList.id },
      })
    }

    return ok(defaultList)
  } catch {
    return err('Error while creating default list')
  }
}

export const getListRole = async (listId: number) => {
  const userId = await getUserId()
  if (!userId) return null
  const payload = await getPayload({ config })
  return resolveListRole(payload, listId, userId)
}

export const getListBySlug = async (slug: string) => {
  const userId = await getUserId()
  if (!userId) return err('Not authenticated')
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'lists',
    where: {
      and: [{ slug: { equals: slug } }, { planArchivedAt: { exists: false } }],
    },
    limit: 1,
  })
  if (!docs[0]) return err('List not found')

  const role = await resolveListRole(payload, docs[0].id, userId)
  if (!role) return err('List not found')

  return ok(docs[0])
}
