'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getSession } from '@/lib/get-session'
import { ok, err } from '@/types/result'
import { revalidatePath } from 'next/cache'
import { checkRateLimit } from '@/lib/rate-limit'
import { getUserPlanLimits } from '@/lib/get-user-plan'
import { isAtLimit, LIMIT_ERRORS } from '@/lib/plan-limits' 

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export const createList = async (data: {
  name: string
  category?: { name?: string; color?: string }
}) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`create-list:${userId}`, 5, 10000)) {
      return err('Too many requests. Please wait a moment.')
    }

    const payload = await getPayload({ config })

    const { limits } = await getUserPlanLimits()
    const { totalDocs: listCount } = await payload.find({
      collection: 'lists',
      where: {
        and: [{ userId: { equals: userId } }, { isDefault: { equals: false } }],
      },
      limit: 0,
    })
    if (isAtLimit(listCount, limits.lists)) return err(LIMIT_ERRORS.LISTS_LIMIT)

    const name = data.name.trim()
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const userSuffix = userId
      .slice(-4)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
    const slug = userSuffix ? `${base}-${userSuffix}` : base

    const list = await payload.create({
      collection: 'lists',
      data: {
        name,
        slug,
        userId,
        isDefault: false,
        ...(data.category && { category: data.category }),
      },
    })

    revalidatePath('/')
    return ok(list)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error while creating the list'
    return err(message)
  }
}

export const getLists = async () => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const lists = await payload.find({
      collection: 'lists',
      where: { userId: { equals: userId } },
      limit: 0,
      sort: 'createdAt',
    })

    return ok(lists)
  } catch {
    return err('Error while fetching lists')
  }
}

export const getList = async (slug: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const lists = await payload.find({
      collection: 'lists',
      where: {
        and: [{ slug: { equals: slug } }, { userId: { equals: userId } }],
      },
      limit: 1,
    })

    if (lists.docs.length === 0) return err('List not found')
    return ok(lists.docs[0])
  } catch {
    return err('Error while fetching list')
  }
}

export const updateList = async (
  id: number,
  data: { name?: string; category?: { name?: string; color?: string } },
) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const existing = await payload.findByID({ collection: 'lists', id })
    if (!existing || existing.userId !== userId) return err('Not authorized')

    const updated = await payload.update({
      collection: 'lists',
      id,
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.category && { category: data.category }),
      },
    })

    revalidatePath('/')
    return ok(updated)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error while updating the list'
    return err(message)
  }
}

export const deleteList = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const existing = await payload.findByID({ collection: 'lists', id })
    if (!existing || existing.userId !== userId) return err('Not authorized')
    if (existing.isDefault) return err('Cannot delete the default list')

    await payload.delete({ collection: 'lists', id })

    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while deleting the list')
  }
}
