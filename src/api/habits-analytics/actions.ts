'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getSession } from '@/lib/get-session'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export type TrackingPeriod = 'week' | 'month' | 'year'

export interface TrackingAnalyticsPoint {
  label: string
  dateKey: string
  value: number
  count: number
}

export interface TrackingFieldAnalytics {
  fieldKey: string
  fieldLabel: string
  fieldType: 'number' | 'text' | 'boolean'
  points: TrackingAnalyticsPoint[]
  total: number
  avg: number
  min: number
  max: number
}

export interface HabitTrackingAnalyticsResult {
  periodLabel: string
  fields: TrackingFieldAnalytics[]
}

export interface HeatmapDay {
  date: string
  count: number
  total: number
}

export interface HeatmapAnalyticsResult {
  year: number
  data: HeatmapDay[]
}

function getPeriodRange(period: TrackingPeriod, offset: number): { from: Date; to: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  if (period === 'week') {
    const dow = (now.getDay() + 6) % 7
    const monday = new Date(y, m, d - dow)
    monday.setHours(0, 0, 0, 0)
    const from = new Date(monday)
    from.setDate(from.getDate() + offset * 7)
    const to = new Date(from)
    to.setDate(to.getDate() + 6)
    to.setHours(23, 59, 59, 999)
    return { from, to }
  }

  if (period === 'month') {
    const baseMonth = m + offset
    const from = new Date(y, baseMonth, 1)
    from.setHours(0, 0, 0, 0)
    const to = new Date(y, baseMonth + 1, 0)
    to.setHours(23, 59, 59, 999)
    return { from, to }
  }

  const from = new Date(y + offset, 0, 1)
  from.setHours(0, 0, 0, 0)
  const to = new Date(y + offset, 11, 31)
  to.setHours(23, 59, 59, 999)
  return { from, to }
}

function getPeriodLabel(period: TrackingPeriod, from: Date, to: Date): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', opts)
  if (period === 'week') {
    if (from.getMonth() === to.getMonth()) {
      return `${fmt(from, { month: 'short' })} ${from.getDate()}–${to.getDate()}, ${from.getFullYear()}`
    }
    return `${fmt(from, { month: 'short', day: 'numeric' })} – ${fmt(to, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  if (period === 'month') return fmt(from, { month: 'long', year: 'numeric' })
  return String(from.getFullYear())
}

function getDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(date)
}

function getBuckets(
  period: TrackingPeriod,
  from: Date,
  to: Date,
): { label: string; dateKey: string; from: Date; to: Date }[] {
  const buckets: { label: string; dateKey: string; from: Date; to: Date }[] = []

  if (period === 'week') {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for (let i = 0; i < 7; i++) {
      const d = new Date(from)
      d.setDate(d.getDate() + i)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)
      buckets.push({ label: DAYS[i], dateKey: getDateKey(d), from: d, to: end })
    }
    return buckets
  }

  if (period === 'month') {
    const cur = new Date(from)
    while (cur <= to) {
      const end = new Date(cur)
      end.setHours(23, 59, 59, 999)
      buckets.push({
        label: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateKey: getDateKey(cur),
        from: new Date(cur),
        to: end,
      })
      cur.setDate(cur.getDate() + 1)
    }
    return buckets
  }

  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  for (let i = 0; i < 12; i++) {
    const monthFrom = new Date(from.getFullYear(), i, 1)
    const monthTo = new Date(from.getFullYear(), i + 1, 0)
    monthTo.setHours(23, 59, 59, 999)
    buckets.push({ label: MONTHS[i], dateKey: getDateKey(monthFrom), from: monthFrom, to: monthTo })
  }
  return buckets
}

export const getHabitTrackingAnalytics = async (
  habitId: number,
  period: TrackingPeriod,
  offset: number,
): Promise<HabitTrackingAnalyticsResult> => {
  const userId = await getUserId()
  const empty: HabitTrackingAnalyticsResult = { periodLabel: '', fields: [] }
  if (!userId) return empty

  const payload = await getPayload({ config })

  const habit = await payload.findByID({ collection: 'habits', id: habitId })
  if (!habit || (habit as any).userId !== userId) return empty

  let trackingFields: any[] = []
  try {
    const raw = (habit as any).trackingFields
    trackingFields = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? [])
  } catch {}

  const activeNumberFields = trackingFields.filter((f: any) => f.enabled && f.type === 'number')
  if (activeNumberFields.length === 0) return empty

  const { from, to } = getPeriodRange(period, offset)
  const periodLabel = getPeriodLabel(period, from, to)
  const buckets = getBuckets(period, from, to)

  const { docs: completions } = await payload.find({
    collection: 'habit-completions',
    where: {
      and: [
        { userId: { equals: userId } },
        { habitId: { equals: habitId } },
        { completedAt: { greater_than_equal: from.toISOString() } },
        { completedAt: { less_than_equal: to.toISOString() } },
      ],
    },
    limit: 0,
  })

  const fields: TrackingFieldAnalytics[] = activeNumberFields.map((field: any) => {
    const points: TrackingAnalyticsPoint[] = buckets.map((bucket) => {
      const inBucket = completions.filter((c) => {
        const d = new Date(c.completedAt as string)
        return d >= bucket.from && d <= bucket.to
      })

      let sum = 0
      let count = 0
      for (const c of inBucket) {
        let values: Record<string, any> = {}
        try {
          const raw = (c as any).trackingValues
          values = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {})
        } catch {}
        const v = values[field.key]
        if (typeof v === 'number' && v > 0) {
          sum += v
          count++
        }
      }

      return { label: bucket.label, dateKey: bucket.dateKey, value: count > 0 ? sum : 0, count }
    })

    const nonZero = points.filter((p) => p.value > 0).map((p) => p.value)
    return {
      fieldKey: field.key,
      fieldLabel: field.label,
      fieldType: field.type,
      points,
      total: nonZero.reduce((s, v) => s + v, 0),
      avg: nonZero.length > 0 ? Math.round(nonZero.reduce((s, v) => s + v, 0) / nonZero.length) : 0,
      min: nonZero.length > 0 ? Math.min(...nonZero) : 0,
      max: nonZero.length > 0 ? Math.max(...nonZero) : 0,
    }
  })

  return { periodLabel, fields }
}

export const getHeatmapAnalytics = async (year: number): Promise<HeatmapAnalyticsResult> => {
  const userId = await getUserId()
  if (!userId) return { year, data: [] }

  const payload = await getPayload({ config })

  const { docs: habits } = await payload.find({
    collection: 'habits',
    where: { and: [{ userId: { equals: userId } }, { archivedAt: { exists: false } }] },
    limit: 0,
  })

  if (habits.length === 0) return { year, data: [] }

  const from = new Date(year, 0, 1)
  from.setHours(0, 0, 0, 0)
  const to = new Date(year, 11, 31)
  to.setHours(23, 59, 59, 999)

  const { docs: completions } = await payload.find({
    collection: 'habit-completions',
    where: {
      and: [
        { userId: { equals: userId } },
        { completedAt: { greater_than_equal: from.toISOString() } },
        { completedAt: { less_than_equal: to.toISOString() } },
      ],
    },
    limit: 0,
  })

  const today = getDateKey(new Date())
  const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  const data: HeatmapDay[] = []
  const cur = new Date(from)

  while (cur <= to) {
    const key = getDateKey(cur)
    if (key > today) {
      data.push({ date: key, count: 0, total: 0 })
      cur.setDate(cur.getDate() + 1)
      continue
    }

    const dayName = DAY_NAMES[cur.getDay()]
    let total = 0
    let count = 0

    for (const habit of habits) {
      const h = habit as any
      let isTarget = false
      if (h.frequency === 'daily') {
        isTarget = true
      } else if (h.frequency === 'days_of_week') {
        isTarget = (h.daysOfWeek ?? []).includes(dayName)
      } else if (h.frequency === 'times_per_week') {
        isTarget = true
      } else if (h.frequency === 'every_x_days') {
        const interval = h.repeatEveryDays ?? 2
        const anchor = h.startDate ? new Date(h.startDate) : from
        anchor.setHours(0, 0, 0, 0)
        const diffDays = Math.round((cur.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays >= 0 && diffDays % interval === 0) isTarget = true
      }

      if (isTarget) {
        total++
        if (
          completions.some(
            (c) => c.habitId === habit.id && getDateKey(new Date(c.completedAt as string)) === key,
          )
        ) {
          count++
        }
      }
    }

    if (total > 0) data.push({ date: key, count, total })
    cur.setDate(cur.getDate() + 1)
  }

  return { year, data }
}
