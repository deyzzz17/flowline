'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ok, err } from '@/types/result'

const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#6366f1' },
  { name: 'Study', color: '#0ea5e9' },
  { name: 'Health', color: '#10b981' },
  { name: 'Personal', color: '#f59e0b' },
  { name: 'Creative', color: '#ec4899' },
]

const getSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export const listTimerCategories = async () => {
  const userId = await getSession()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'timer-categories',
    where: { userId: { equals: userId } },
    limit: 0,
  })

  if (existing.docs.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await payload.create({
        collection: 'timer-categories',
        data: { ...cat, userId, isDefault: true },
      })
    }
    return await payload.find({
      collection: 'timer-categories',
      where: { userId: { equals: userId } },
      limit: 0,
    })
  }

  return existing
}

export const createTimerCategory = async (data: { name: string; color: string }) => {
  try {
    const userId = await getSession()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const category = await payload.create({
      collection: 'timer-categories',
      data: { ...data, userId, isDefault: false },
    })
    return ok(category)
  } catch {
    return err('Error creating category')
  }
}

export const deleteTimerCategory = async (id: number) => {
  try {
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'timer-categories', id })
    return ok(true)
  } catch {
    return err('Error deleting category')
  }
}
