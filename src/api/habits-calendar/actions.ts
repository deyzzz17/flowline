'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { generateOccurrences } from '@/api/calendar/calendar-recurrence'

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

interface RefOccurrence {
  date: Date
  startDate: Date
  endDate: Date
}

function buildRefEventOccurrences(
  refEvent: any,
  overrides: any[],
  from: Date,
  to: Date,
): Map<string, RefOccurrence> {
  const map = new Map<string, RefOccurrence>()

  if (!refEvent?.recurrence?.frequency) {
    const d = new Date(refEvent.startDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    map.set(key, {
      date: d,
      startDate: new Date(refEvent.startDate),
      endDate: new Date(refEvent.endDate),
    })
    return map
  }

  const overrideDates = new Set<string>(
    overrides.map((o) => {
      const d = new Date(o.originalDate ?? o.startDate)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }),
  )

  const exceptions = new Set<string>([
    ...((refEvent.exceptions ?? []) as { date: string }[]).map((ex) =>
      new Date(ex.date).toISOString().slice(0, 10),
    ),
    ...overrideDates,
  ])

  const occurrences = generateOccurrences(
    {
      startDate: refEvent.startDate,
      endDate: refEvent.endDate,
      recurrence: refEvent.recurrence,
      adjustments: refEvent.adjustments ?? [],
    },
    from,
    to,
    exceptions,
  )

  for (const occ of occurrences) {
    const key = `${occ.date.getFullYear()}-${String(occ.date.getMonth() + 1).padStart(2, '0')}-${String(occ.date.getDate()).padStart(2, '0')}`
    map.set(key, {
      date: occ.date,
      startDate: occ.date,
      endDate: occ.endDate,
    })
  }

  for (const override of overrides) {
    const d = new Date(override.originalDate ?? override.startDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    map.set(key, {
      date: d,
      startDate: new Date(override.startDate),
      endDate: new Date(override.endDate),
    })
  }

  return map
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
  const widerFrom = new Date(fromDate)
  widerFrom.setDate(widerFrom.getDate() - 7)
  const widerTo = new Date(toDate)
  widerTo.setDate(widerTo.getDate() + 7)

  const events: HabitCalendarEvent[] = []

  for (const habit of habits) {
    const h = habit as any
    const duration = (h.habitDuration ?? 30) * 60 * 1000

    const habitStart = h.startDate ? new Date(h.startDate) : fromDate
    habitStart.setHours(0, 0, 0, 0)
    const effectiveFrom = habitStart > fromDate ? habitStart : fromDate

    let refOccurrences: Map<string, RefOccurrence> = new Map()

    if (h.calendarMode === 'relative' && h.relativeEventId) {
      try {
        const refEvent = await payload.findByID({
          collection: 'calendar-events',
          id: h.relativeEventId,
        })

        if (refEvent) {
          const { docs: overrideDocs } = await payload.find({
            collection: 'calendar-events',
            where: {
              and: [
                { recurrenceId: { equals: h.relativeEventId } },
                { originalDate: { greater_than_equal: widerFrom.toISOString() } },
                { originalDate: { less_than_equal: widerTo.toISOString() } },
              ],
            },
            limit: 500,
          })

          refOccurrences = buildRefEventOccurrences(refEvent, overrideDocs, widerFrom, widerTo)
        }
      } catch {}
    }

    const occurrences = generateHabitOccurrences(h, effectiveFrom, toDate)

    for (const occDate of occurrences) {
      let eventStart: Date
      let eventEnd: Date

      if (h.calendarMode === 'relative' && refOccurrences.size > 0) {
        const dayKey = `${occDate.getFullYear()}-${String(occDate.getMonth() + 1).padStart(2, '0')}-${String(occDate.getDate()).padStart(2, '0')}`
        const refOcc = refOccurrences.get(dayKey)

        if (!refOcc) continue

        if (h.relativePosition === 'before') {
          eventEnd = new Date(refOcc.startDate)
          eventStart = new Date(eventEnd.getTime() - duration)
        } else {
          eventStart = new Date(refOcc.endDate)
          eventEnd = new Date(eventStart.getTime() + duration)
        }
      } else if (h.calendarMode === 'relative' && refOccurrences.size === 0) {
        continue
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
