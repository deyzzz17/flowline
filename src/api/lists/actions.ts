'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { ok, err } from '@/types/result'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

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

const getSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export const createList = async (input: CreateListInput) => {
  try {
    const userId = await getSession()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

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
  const userId = await getSession()
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
    const userId = await getSession()
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
    const userId = await getSession()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const list = await payload.findByID({ collection: 'lists', id })

    if (list.userId !== userId) return err('Not authorized')

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
    const userId = await getSession()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const list = await payload.findByID({ collection: 'lists', id })

    if (list.userId !== userId) return err('Not authorized')
    if (list.isDefault) return err('Cannot delete the default list')

    const { docs: tasks } = await payload.find({
      collection: 'tasks',
      where: { list: { equals: id } },
      limit: 0,
    })

    for (const task of tasks) {
      await payload.update({
        collection: 'tasks',
        id: task.id,
        data: { list: null },
      })
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
    const userId = await getSession()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const existing = await payload.find({
      collection: 'lists',
      where: {
        and: [{ userId: { equals: userId } }, { isDefault: { equals: true } }],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) return ok(existing.docs[0])

    const defaultList = await payload.create({
      collection: 'lists',
      data: {
        name: 'Todo',
        userId,
        isDefault: true,
        category: { name: 'Personal', color: '#8b5cf6' },
      },
    })

    return ok(defaultList)
  } catch {
    return err('Error while creating default list')
  }
}
