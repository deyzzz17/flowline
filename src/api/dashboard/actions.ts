'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { generateOccurrences } from '@/api/calendar/calendar-recurrence'
import { getSession } from '@/lib/get-session'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export interface DashboardTodayEvent {
  id: string | number
  title: string
  startDate: string
  endDate: string
  color: string
  allDay: boolean
}

export async function getDashboardTodayEvents(): Promise<DashboardTodayEvent[]> {
  const userId = await getUserId()
  if (!userId) return []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const payload = await getPayload({ config })

  const { docs: rawEvents } = await payload.find({
    collection: 'calendar-events',
    where: {
      and: [
        { userId: { equals: userId } },
        { startDate: { less_than_equal: todayEnd.toISOString() } },
      ],
    },
    limit: 200,
    sort: 'startDate',
  })

  const results: DashboardTodayEvent[] = []

  const parents = rawEvents.filter((e: any) => e.recurrence?.frequency && !e.recurrenceId)
  const overrides = rawEvents.filter((e: any) => e.recurrenceId)
  const normal = rawEvents.filter((e: any) => !e.recurrence?.frequency && !e.recurrenceId)

  for (const e of normal) {
    const start = new Date(e.startDate)
    const end = new Date(e.endDate)
    if (start <= todayEnd && end >= todayStart) {
      results.push({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        color: e.color ?? '#8b5cf6',
        allDay: e.allDay ?? false,
      })
    }
  }

  for (const e of overrides) {
    const start = new Date(e.startDate)
    const end = new Date(e.endDate)
    if (start <= todayEnd && end >= todayStart) {
      results.push({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        color: e.color ?? '#8b5cf6',
        allDay: e.allDay ?? false,
      })
    }
  }

  for (const parent of parents) {
    const occurrences = generateOccurrences(
      { ...(parent as any), adjustments: (parent as any).adjustments ?? [] },
      todayStart,
      todayEnd,
    )

    for (const occ of occurrences) {
      results.push({
        id: `${parent.id}-${occ.date.toISOString()}`,
        title: occ.adjustment?.title ?? parent.title,
        startDate: occ.date.toISOString(),
        endDate: occ.endDate.toISOString(),
        color: occ.adjustment?.color ?? parent.color ?? '#8b5cf6',
        allDay: occ.adjustment?.allDay ?? parent.allDay ?? false,
      })
    }
  }

  return results.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}
