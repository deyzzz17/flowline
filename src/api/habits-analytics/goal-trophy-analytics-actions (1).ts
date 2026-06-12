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

export type TrophyPeriod = 'day' | 'week' | 'month' | 'year'

export interface TrophyPoint {
  label: string
  dateKey: string
  count: number
}

export interface TrophyAnalyticsResult {
  periodLabel: string
  points: TrophyPoint[]
  total: number
  claimed: {
    habitName: string
    habitColor: string
    goalDescription: string
    completedAt: string
  }[]
}

function getPeriodRange(period: TrophyPeriod, offset: number): { from: Date; to: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  if (period === 'day') {
    const from = new Date(y, m, d + offset)
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setHours(23, 59, 59, 999)
    return { from, to }
  }

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

function getPeriodLabel(period: TrophyPeriod, from: Date, to: Date): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', opts)
  if (period === 'day')
    return fmt(from, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  if (period === 'week') {
    if (from.getMonth() === to.getMonth())
      return `${fmt(from, { month: 'short' })} ${from.getDate()}–${to.getDate()}, ${from.getFullYear()}`
    return `${fmt(from, { month: 'short', day: 'numeric' })} – ${fmt(to, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  if (period === 'month') return fmt(from, { month: 'long', year: 'numeric' })
  return String(from.getFullYear())
}

function getBuckets(
  period: TrophyPeriod,
  from: Date,
  to: Date,
): { label: string; dateKey: string; from: Date; to: Date }[] {
  const fmt = (d: Date) => new Intl.DateTimeFormat('en-CA').format(d)

  if (period === 'day') {
    const buckets = []
    for (let h = 0; h < 24; h++) {
      const start = new Date(from)
      start.setHours(h, 0, 0, 0)
      const end = new Date(from)
      end.setHours(h, 59, 59, 999)
      buckets.push({
        label: `${String(h).padStart(2, '0')}:00`,
        dateKey: `${fmt(from)}-${h}`,
        from: start,
        to: end,
      })
    }
    return buckets
  }

  if (period === 'week') {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(from)
      d.setDate(d.getDate() + i)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)
      return { label: DAYS[i], dateKey: fmt(d), from: d, to: end }
    })
  }

  if (period === 'month') {
    const buckets = []
    const cur = new Date(from)
    while (cur <= to) {
      const end = new Date(cur)
      end.setHours(23, 59, 59, 999)
      buckets.push({
        label: String(cur.getDate()),
        dateKey: fmt(cur),
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
  return Array.from({ length: 12 }, (_, i) => {
    const mFrom = new Date(from.getFullYear(), i, 1)
    const mTo = new Date(from.getFullYear(), i + 1, 0)
    mTo.setHours(23, 59, 59, 999)
    return { label: MONTHS[i], dateKey: fmt(mFrom), from: mFrom, to: mTo }
  })
}

function parseGoals(habit: any): any[] {
  const raw = (habit as any).goals
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {}
  const oldRaw = (habit as any).goal
  if (!oldRaw) return []
  try {
    const old = typeof oldRaw === 'string' ? JSON.parse(oldRaw) : oldRaw
    if (old?.description) return [old]
  } catch {}
  return []
}

export const getGoalTrophyAnalytics = async (
  period: TrophyPeriod,
  offset: number,
): Promise<TrophyAnalyticsResult> => {
  const userId = await getUserId()
  const empty: TrophyAnalyticsResult = { periodLabel: '', points: [], total: 0, claimed: [] }
  if (!userId) return empty

  const payload = await getPayload({ config })

  const { docs: habits } = await payload.find({
    collection: 'habits',
    where: { userId: { equals: userId } },
    limit: 0,
  })

  if (habits.length === 0) return empty

  const { from, to } = getPeriodRange(period, offset)
  const periodLabel = getPeriodLabel(period, from, to)
  const buckets = getBuckets(period, from, to)

  const claimedGoals: {
    habitName: string
    habitColor: string
    goalDescription: string
    completedAt: Date
  }[] = []

  for (const habit of habits) {
    const goals = parseGoals(habit)
    for (const goal of goals) {
      if (!goal.completedAt) continue
      const completedAt = new Date(goal.completedAt)
      if (completedAt >= from && completedAt <= to) {
        claimedGoals.push({
          habitName: habit.name,
          habitColor: (habit as any).color ?? '#8b5cf6',
          goalDescription: goal.description,
          completedAt,
        })
      }
    }
  }

  const points: TrophyPoint[] = buckets.map((bucket) => {
    const count = claimedGoals.filter(
      (g) => g.completedAt >= bucket.from && g.completedAt <= bucket.to,
    ).length
    return { label: bucket.label, dateKey: bucket.dateKey, count }
  })

  return {
    periodLabel,
    points,
    total: claimedGoals.length,
    claimed: claimedGoals
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
      .map((g) => ({
        habitName: g.habitName,
        habitColor: g.habitColor,
        goalDescription: g.goalDescription,
        completedAt: g.completedAt.toISOString(),
      })),
  }
}
