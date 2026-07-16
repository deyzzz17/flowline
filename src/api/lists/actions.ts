'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { ok, err } from '@/types/result'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/get-session'
import { getUserPlanLimits } from '@/lib/get-user-plan'
import { isAtLimit, LIMIT_ERRORS } from '@/lib/plan-limits'

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

export const createList = async (input: CreateListInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`create-list:${userId}`, 1, 1000)) {
      return err('Too many requests. Please wait a moment.')
    }

    const payload = await getPayload({ config })

    const { limits } = await getUserPlanLimits()

    const { totalDocs } = await payload.find({
      collection: 'lists',
      where: { userId: { equals: userId } },
      limit: 0,
    })

    if (isAtLimit(totalDocs, limits.lists)) {
      return err(LIMIT_ERRORS.LISTS_LIMIT)
    }

    const { docs: existing } = await payload.find({
      collection: 'lists',
      where: {
        and: [{ userId: { equals: userId } }, { name: { equals: input.name.trim() } }],
      },
      limit: 1,
    })

    if (existing.length > 0) {
      return err('DUPLICATE_NAME')
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
      userId: { equals: userId },
    },
  })
}

export const getListById = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const list = await payload.findByID({ collection: 'lists', id })

    if (list.userId !== userId) return err('Not authorized')

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
    const list = await payload.findByID({ collection: 'lists', id })

    if (list.userId !== userId) return err('Not authorized')

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
        return err('DUPLICATE_NAME')
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

    if (list.userId !== userId) return err('Not authorized')

    const { docs: tasks } = await payload.find({
      collection: 'tasks',
      where: { list: { equals: id } },
      limit: 0,
    })

    for (const task of tasks) {
      await payload.delete({ collection: 'tasks', id: task.id })
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

export const getListBySlug = async (slug: string) => {
  const userId = await getUserId()
  if (!userId) return err('Not authenticated')
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'lists',
    where: { and: [{ userId: { equals: userId } }, { slug: { equals: slug } }] },
    limit: 1,
  })
  if (!docs[0]) return err('List not found')
  return ok(docs[0])
}