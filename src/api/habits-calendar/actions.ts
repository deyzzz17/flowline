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


function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const DAY_MAP: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

function generateHabitOccurrences(habit: any, from: Date, to: Date): Date[] {
  const dates: Date[] = []

  const cur = new Date(from)
  cur.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(23, 59, 59, 999)

  if (habit.frequency === 'daily') {
    while (cur <= end) {
      dates.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
  } else if (habit.frequency === 'days_of_week' && habit.daysOfWeek?.length) {
    const targetDays = new Set((habit.daysOfWeek as string[]).map((d) => DAY_MAP[d]))
    while (cur <= end) {
      if (targetDays.has(cur.getDay())) {
        dates.push(new Date(cur))
      }
      cur.setDate(cur.getDate() + 1)
    }
  } else if (habit.frequency === 'times_per_week') {
    while (cur <= end) {
      dates.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
  } else if (habit.frequency === 'every_x_days') {
    const interval = habit.repeatEveryDays ?? 2
    const anchor = habit.startDate ? new Date(habit.startDate) : from
    anchor.setHours(0, 0, 0, 0)

    while (cur <= end) {
      const diffMs = cur.getTime() - anchor.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays % interval === 0) {
        dates.push(new Date(cur))
      }
      cur.setDate(cur.getDate() + 1)
    }
  }

  return dates
}

function doesRefEventOccurOnDate(refEvent: any, date: Date): boolean {
  if (!refEvent?.recurrence?.frequency) {
    const eventDate = new Date(refEvent.startDate)
    return isSameDay(eventDate, date)
  }

  const recurrence = refEvent.recurrence
  const eventStart = new Date(refEvent.startDate)
  eventStart.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)

  if (checkDate < eventStart) return false

  const interval = recurrence.interval ?? 1

  if (recurrence.frequency === 'daily') {
    const diffDays = Math.round(
      (checkDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24),
    )
    return diffDays % interval === 0
  }

  if (recurrence.frequency === 'weekly') {
    const diffDays = Math.round(
      (checkDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (diffDays % (interval * 7) !== 0 && !recurrence.daysOfWeek?.length) return false
    if (recurrence.daysOfWeek?.length) {
      const dayNumbers = new Set(
        recurrence.daysOfWeek.map((d: string) =>
          isNaN(Number(d)) ? (DAY_MAP[d] ?? -1) : Number(d),
        ),
      )
      return dayNumbers.has(date.getDay())
    }
    return diffDays % (interval * 7) === 0
  }

  if (recurrence.frequency === 'monthly') {
    if (date.getDate() !== eventStart.getDate()) return false
    const diffMonths =
      (date.getFullYear() - eventStart.getFullYear()) * 12 +
      (date.getMonth() - eventStart.getMonth())
    return diffMonths % interval === 0
  }

  if (recurrence.frequency === 'yearly') {
    if (date.getDate() !== eventStart.getDate()) return false
    if (date.getMonth() !== eventStart.getMonth()) return false
    return (date.getFullYear() - eventStart.getFullYear()) % interval === 0
  }

  return false
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
    const duration = (h.habitDuration ?? 30) * 60 * 1000

    const habitStart = h.startDate ? new Date(h.startDate) : fromDate
    habitStart.setHours(0, 0, 0, 0)
    const effectiveFrom = habitStart > fromDate ? habitStart : fromDate

    let refEvent: any = null
    if (h.calendarMode === 'relative' && h.relativeEventId) {
      try {
        refEvent = await payload.findByID({
          collection: 'calendar-events',
          id: h.relativeEventId,
        })
      } catch {}
    }

    const occurrences = generateHabitOccurrences(h, effectiveFrom, toDate)

    for (const occDate of occurrences) {
      let eventStart: Date
      let eventEnd: Date

      if (h.calendarMode === 'relative' && refEvent) {
        if (!doesRefEventOccurOnDate(refEvent, occDate)) continue

        const refStart = new Date(refEvent.startDate)
        const refEnd = new Date(refEvent.endDate)

        const dayRefStart = new Date(occDate)
        dayRefStart.setHours(refStart.getHours(), refStart.getMinutes(), 0, 0)
        const dayRefEnd = new Date(occDate)
        dayRefEnd.setHours(refEnd.getHours(), refEnd.getMinutes(), 0, 0)

        if (h.relativePosition === 'before') {
          eventEnd = new Date(dayRefStart)
          eventStart = new Date(eventEnd.getTime() - duration)
        } else {
          eventStart = new Date(dayRefEnd)
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
