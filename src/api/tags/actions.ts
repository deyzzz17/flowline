'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { ok, err } from '@/types/result'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/get-session'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export const listUserTags = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })

  return await payload.find({
    collection: 'user-tags',
    where: { userId: { equals: userId } },
    sort: 'createdAt',
    limit: 0,
  })
}

export const createUserTag = async (data: { name: string; color: string }) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!data.name.trim()) return err('Name is required')
    if (!data.color.trim()) return err('Color is required')

    const payload = await getPayload({ config })

    const tag = await payload.create({
      collection: 'user-tags',
      data: {
        name: data.name.trim(),
        color: data.color,
        userId,
      },
    })

    const { totalDocs } = await payload.find({
      collection: 'user-tags',
      where: { userId: { equals: userId } },
      limit: 0,
    })
    if (totalDocs >= 80) return err('LIMIT_REACHED')

    revalidatePath('/')
    return ok(tag)
  } catch {
    return err('Error while creating tag')
  }
}

export const deleteUserTag = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const tag = await payload.findByID({ collection: 'user-tags', id })
    if (tag.userId !== userId) return err('Not authorized')

    await payload.delete({ collection: 'user-tags', id })

    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while deleting tag')
  }
}

export const updateUserTag = async (id: number, data: { name?: string; color?: string }) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const tag = await payload.findByID({ collection: 'user-tags', id })
    if (tag.userId !== userId) return err('Not authorized')

    const updated = await payload.update({
      collection: 'user-tags',
      id,
      data: {
        ...(data.name?.trim() && { name: data.name.trim() }),
        ...(data.color && { color: data.color }),
      },
    })

    revalidatePath('/')
    return ok(updated)
  } catch {
    return err('Error while updating tag')
  }
}
