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

export interface CalendarEventData {
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay?: boolean
  color?: string
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