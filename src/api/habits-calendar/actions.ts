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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
      if (targetDays.has(cur.getDay())) dates.push(new Date(cur))
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
      const diffDays = Math.round((cur.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays % interval === 0) dates.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
  }

  return dates
}

// Vérifie si l'event récurrent de référence tombe ce jour-là
function doesRefEventOccurOnDate(refEvent: any, date: Date): boolean {
  if (!refEvent?.recurrence?.frequency) {
    return isSameDay(new Date(refEvent.startDate), date)
  }

  const recurrence = refEvent.recurrence
  const eventStart = new Date(refEvent.startDate)
  eventStart.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)

  if (checkDate < eventStart) return false

  // Vérifie les exceptions (occurrences supprimées)
  const exceptions: string[] = (refEvent.exceptions ?? []).map((ex: any) =>
    new Date(ex.date).toISOString().slice(0, 10),
  )
  if (exceptions.includes(checkDate.toISOString().slice(0, 10))) return false

  const interval = recurrence.interval ?? 1

  if (recurrence.frequency === 'daily') {
    const diffDays = Math.round(
      (checkDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24),
    )
    return diffDays % interval === 0
  }

  if (recurrence.frequency === 'weekly') {
    if (recurrence.daysOfWeek?.length) {
      const dayNumbers = new Set(
        recurrence.daysOfWeek.map((d: string) =>
          isNaN(Number(d)) ? (DAY_MAP[d] ?? -1) : Number(d),
        ),
      )
      if (!dayNumbers.has(date.getDay())) return false
      const diffDays = Math.round(
        (checkDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24),
      )
      const weekDiff = Math.floor(diffDays / 7)
      return weekDiff % interval === 0
    }
    const diffDays = Math.round(
      (checkDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24),
    )
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

interface ResolvedOccurrence {
  startDate: Date
  endDate: Date
}

function resolveRefEventOccurrence(
  refEvent: any,
  overrides: any[],
  date: Date,
): ResolvedOccurrence {
  const dateKey = date.toISOString().slice(0, 10)

  const override = overrides.find((o) => {
    const origDate = o.originalDate ?? o.startDate
    return new Date(origDate).toISOString().slice(0, 10) === dateKey
  })
  if (override) {
    return {
      startDate: new Date(override.startDate),
      endDate: new Date(override.endDate),
    }
  }

  const adjustments: any[] = (refEvent.adjustments ?? [])
    .filter((adj: any) => new Date(adj.fromDate) <= date)
    .sort((a: any, b: any) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime())

  const adj = adjustments[0]

  const baseStart = new Date(refEvent.startDate)
  const baseEnd = new Date(refEvent.endDate)
  const duration = baseEnd.getTime() - baseStart.getTime()

  const refStart = adj?.startDate ? new Date(adj.startDate) : baseStart
  const refEnd = adj?.endDate ? new Date(adj.endDate) : baseEnd
  const adjDuration = refEnd.getTime() - refStart.getTime()

  const occStart = new Date(date)
  occStart.setHours(refStart.getHours(), refStart.getMinutes(), 0, 0)
  const occEnd = new Date(occStart.getTime() + (adj ? adjDuration : duration))

  return { startDate: occStart, endDate: occEnd }
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
    let refEventOverrides: any[] = []

    if (h.calendarMode === 'relative' && h.relativeEventId) {
      try {
        refEvent = await payload.findByID({
          collection: 'calendar-events',
          id: h.relativeEventId,
        })
        const { docs: overrideDocs } = await payload.find({
          collection: 'calendar-events',
          where: {
            and: [
              { recurrenceId: { equals: h.relativeEventId } },
              { startDate: { greater_than_equal: fromDate.toISOString() } },
              { startDate: { less_than_equal: toDate.toISOString() } },
            ],
          },
          limit: 500,
        })
        refEventOverrides = overrideDocs
      } catch {}
    }

    const occurrences = generateHabitOccurrences(h, effectiveFrom, toDate)

    for (const occDate of occurrences) {
      let eventStart: Date
      let eventEnd: Date

      if (h.calendarMode === 'relative' && refEvent) {
        if (!doesRefEventOccurOnDate(refEvent, occDate)) continue

        const resolved = resolveRefEventOccurrence(refEvent, refEventOverrides, occDate)

        if (h.relativePosition === 'before') {
          eventEnd = new Date(resolved.startDate)
          eventStart = new Date(eventEnd.getTime() - duration)
        } else {
          eventStart = new Date(resolved.endDate)
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
