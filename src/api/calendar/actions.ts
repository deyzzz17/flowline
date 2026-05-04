'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ok, err } from '@/types/result'

const getUserId = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

const DEFAULT_CALENDAR_CATEGORIES = [
  { name: 'Personal', color: '#8b5cf6', isDefault: true },
  { name: 'Work', color: '#3b82f6', isDefault: true },
  { name: 'Health', color: '#10b981', isDefault: true },
]


export interface CalendarCategoryData {
  name: string
  color: string
}

export const listCalendarCategories = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'calendar-categories',
    where: { userId: { equals: userId } },
    limit: 0,
    sort: 'createdAt',
  })

  if (existing.docs.length === 0) {
    for (const cat of DEFAULT_CALENDAR_CATEGORIES) {
      await payload.create({
        collection: 'calendar-categories',
        data: { ...cat, userId },
      })
    }
    return payload.find({
      collection: 'calendar-categories',
      where: { userId: { equals: userId } },
      limit: 0,
      sort: 'createdAt',
    })
  }

  return existing
}

export const createCalendarCategory = async (data: CalendarCategoryData) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const payload = await getPayload({ config })
    const cat = await payload.create({
      collection: 'calendar-categories',
      data: { ...data, userId, isDefault: false },
    })
    return ok(cat)
  } catch {
    return err('Error creating category')
  }
}

export const updateCalendarCategory = async (id: number, data: Partial<CalendarCategoryData>) => {
  try {
    const payload = await getPayload({ config })
    const cat = await payload.update({
      collection: 'calendar-categories',
      id,
      data,
    })
    return ok(cat)
  } catch {
    return err('Error updating category')
  }
}

export const deleteCalendarCategory = async (id: number) => {
  try {
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'calendar-categories', id })
    return ok(true)
  } catch {
    return err('Error deleting category')
  }
}


export interface CalendarEventData {
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay?: boolean
  color?: string
  categoryId?: number | null
}

export const listCalendarEvents = async (from: string, to: string) => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }
  const payload = await getPayload({ config })
  return payload.find({
    collection: 'calendar-events',
    where: {
      and: [
        { userId: { equals: userId } },
        { startDate: { greater_than_equal: from } },
        { startDate: { less_than_equal: to } },
      ],
    },
    limit: 200,
    sort: 'startDate',
  })
}

export const createCalendarEvent = async (data: CalendarEventData) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const payload = await getPayload({ config })
    const event = await payload.create({
      collection: 'calendar-events',
      data: { ...data, userId },
    })
    return ok(event)
  } catch {
    return err('Error creating event')
  }
}

export const updateCalendarEvent = async (id: number, data: Partial<CalendarEventData>) => {
  try {
    const payload = await getPayload({ config })
    const event = await payload.update({
      collection: 'calendar-events',
      id,
      data,
    })
    return ok(event)
  } catch {
    return err('Error updating event')
  }
}

export const deleteCalendarEvent = async (id: number) => {
  try {
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'calendar-events', id })
    return ok(true)
  } catch {
    return err('Error deleting event')
  }
}
