'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

const getUserId = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export interface HabitCalendarEvent {
  id: string 
  habitId: number
  habitSlug: string
  title: string
  color: string
  startDate: string 
  endDate: string  
  allDay: boolean
  type: 'habit'
}

export const getHabitCalendarEvents = async (
  from: string,
  to: string,
): Promise<HabitCalendarEvent[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })

  const { docs: habits } = await payload.find({
    collection: 'habits',
    where: {
      and: [
        { userId: { equals: userId } },
        { showInCalendar: { equals: true } },
        { archivedAt: { exists: false } },
      ],
    },
    limit: 0,
  })

  if (habits.length === 0) return []

  const fromDate = new Date(from)
  const toDate = new Date(to)
  const events: HabitCalendarEvent[] = []

  for (const habit of habits) {
    const h = habit as any

    const startDate = h.startDate ? new Date(h.startDate) : fromDate
    const effectiveFrom = startDate > fromDate ? startDate : fromDate

    let relativeEventStart: Date | null = null
    let relativeEventEnd: Date | null = null

    if (h.calendarMode === 'relative' && h.relativeEventId) {
      try {
        const refEvent = await payload.findByID({
          collection: 'calendar-events',
          id: h.relativeEventId,
        })
        if (refEvent) {
          relativeEventStart = new Date((refEvent as any).startDate)
          relativeEventEnd = new Date((refEvent as any).endDate)
        }
      } catch {}
    }

    const duration = (h.habitDuration ?? 30) * 60 * 1000 // ms

    const occurrences = generateHabitOccurrences(h, effectiveFrom, toDate)

    for (const occDate of occurrences) {
      let eventStart: Date
      let eventEnd: Date

      if (h.calendarMode === 'relative' && relativeEventStart && relativeEventEnd) {
        const refStartHour = relativeEventStart.getHours()
        const refStartMin = relativeEventStart.getMinutes()
        const refEndHour = relativeEventEnd.getHours()
        const refEndMin = relativeEventEnd.getMinutes()

        const refDayStart = new Date(occDate)
        refDayStart.setHours(refStartHour, refStartMin, 0, 0)
        const refDayEnd = new Date(occDate)
        refDayEnd.setHours(refEndHour, refEndMin, 0, 0)

        if (h.relativePosition === 'before') {
          eventEnd = new Date(refDayStart)
          eventStart = new Date(eventEnd.getTime() - duration)
        } else {
          eventStart = new Date(refDayEnd)
          eventEnd = new Date(eventStart.getTime() + duration)
        }
      } else {
        const [hours, minutes] = (h.habitTime ?? '08:00').split(':').map(Number)
        eventStart = new Date(occDate)
        eventStart.setHours(hours, minutes, 0, 0)
        eventEnd = new Date(eventStart.getTime() + duration)
      }

      events.push({
        id: `habit-${habit.id}-${eventStart.toISOString()}`,
        habitId: habit.id,
        habitSlug: h.slug ?? '',
        title: habit.name,
        color: h.color ?? '#8b5cf6',
        startDate: eventStart.toISOString(),
        endDate: eventEnd.toISOString(),
        allDay: false,
        type: 'habit',
      })
    }
  }

  return events
}

function generateHabitOccurrences(habit: any, from: Date, to: Date): Date[] {
  const dates: Date[] = []
  const DAY_MAP: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  }

  const cur = new Date(from)
  cur.setHours(0, 0, 0, 0)

  while (cur <= to) {
    const dayOfWeek = cur.getDay()

    if (habit.frequency === 'daily') {
      dates.push(new Date(cur))
    } else if (habit.frequency === 'days_of_week' && habit.daysOfWeek?.length) {
      const targetDays = (habit.daysOfWeek as string[]).map((d) => DAY_MAP[d])
      if (targetDays.includes(dayOfWeek)) {
        dates.push(new Date(cur))
      }
    } else if (habit.frequency === 'times_per_week') {
      dates.push(new Date(cur))
    }

    cur.setDate(cur.getDate() + 1)
  }

  return dates
}