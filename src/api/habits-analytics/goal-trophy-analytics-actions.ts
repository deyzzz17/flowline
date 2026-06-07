'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

const getUserSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session ?? null
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

function localDateStr(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date)
}

function localMidnight(dateStr: string, timezone: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const utcMidnight = new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
  const localHour = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: '2-digit', hour12: false }).format(
      utcMidnight,
    ),
  )
  const adjusted = new Date(utcMidnight.getTime() - localHour * 60 * 60 * 1000)
  return adjusted
}

function getPeriodRange(
  period: TrophyPeriod,
  offset: number,
  timezone: string,
): { from: Date; to: Date } {
  const now = new Date()
  const todayStr = localDateStr(now, timezone) 
  const [y, m, d] = todayStr.split('-').map(Number)

  if (period === 'day') {
    const targetDate = new Date(Date.UTC(y, m - 1, d + offset))
    const dateStr = localDateStr(targetDate, timezone)
    const from = localMidnight(dateStr, timezone)
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1)
    return { from, to }
  }

  if (period === 'week') {
    const todayDate = new Date(Date.UTC(y, m - 1, d))
    const dow = (todayDate.getUTCDay() + 6) % 7
    const mondayUTC = new Date(Date.UTC(y, m - 1, d - dow + offset * 7))
    const mondayStr = localDateStr(mondayUTC, timezone)
    const from = localMidnight(mondayStr, timezone)
    const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
    return { from, to }
  }

  if (period === 'month') {
    const baseMonth = m - 1 + offset
    const year = y + Math.floor(baseMonth / 12)
    const month = ((baseMonth % 12) + 12) % 12
    const firstStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const from = localMidnight(firstStr, timezone)
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const lastStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const lastMidnight = localMidnight(lastStr, timezone)
    const to = new Date(lastMidnight.getTime() + 24 * 60 * 60 * 1000 - 1)
    return { from, to }
  }

  const year = y + offset
  const from = localMidnight(`${year}-01-01`, timezone)
  const to = new Date(localMidnight(`${year + 1}-01-01`, timezone).getTime() - 1)
  return { from, to }
}

function getPeriodLabel(period: TrophyPeriod, from: Date, to: Date, timezone: string): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('en-US', { timeZone: timezone, ...opts })
  if (period === 'day')
    return fmt(from, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  if (period === 'week') {
    const fromMonth = from.toLocaleDateString('en-US', { timeZone: timezone, month: 'short' })
    const toMonth = to.toLocaleDateString('en-US', { timeZone: timezone, month: 'short' })
    const fromDay = parseInt(
      from.toLocaleDateString('en-US', { timeZone: timezone, day: 'numeric' }),
    )
    const toDay = parseInt(to.toLocaleDateString('en-US', { timeZone: timezone, day: 'numeric' }))
    const year = from.toLocaleDateString('en-US', { timeZone: timezone, year: 'numeric' })
    if (fromMonth === toMonth) return `${fromMonth} ${fromDay}–${toDay}, ${year}`
    return `${fromMonth} ${fromDay} – ${toMonth} ${toDay}, ${year}`
  }
  if (period === 'month') return fmt(from, { month: 'long', year: 'numeric' })
  return from.toLocaleDateString('en-US', { timeZone: timezone, year: 'numeric' })
}

function getBuckets(
  period: TrophyPeriod,
  from: Date,
  to: Date,
  timezone: string,
): { label: string; dateKey: string; from: Date; to: Date }[] {
  const fmtDate = (d: Date) => localDateStr(d, timezone)

  if (period === 'day') {
    const buckets = []
    const dateStr = fmtDate(from)
    for (let h = 0; h < 24; h++) {
      const bucketFrom = localMidnight(dateStr, timezone)
      bucketFrom.setTime(bucketFrom.getTime() + h * 60 * 60 * 1000)
      const bucketTo = new Date(bucketFrom.getTime() + 60 * 60 * 1000 - 1)
      buckets.push({
        label: `${h}h`,
        dateKey: `${dateStr}|${h}`,
        from: bucketFrom,
        to: bucketTo,
      })
    }
    return buckets
  }

  if (period === 'week') {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return Array.from({ length: 7 }, (_, i) => {
      const bucketFrom = new Date(from.getTime() + i * 24 * 60 * 60 * 1000)
      const bucketTo = new Date(bucketFrom.getTime() + 24 * 60 * 60 * 1000 - 1)
      return { label: DAYS[i], dateKey: fmtDate(bucketFrom), from: bucketFrom, to: bucketTo }
    })
  }

  if (period === 'month') {
    const buckets = []
    const dateStr = fmtDate(from)
    const [y, m] = dateStr.split('-').map(Number)
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
    for (let i = 0; i < daysInMonth; i++) {
      const bucketFrom = new Date(from.getTime() + i * 24 * 60 * 60 * 1000)
      const bucketTo = new Date(bucketFrom.getTime() + 24 * 60 * 60 * 1000 - 1)
      buckets.push({
        label: String(i + 1),
        dateKey: fmtDate(bucketFrom),
        from: bucketFrom,
        to: bucketTo,
      })
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
  const yearStr = fmtDate(from).split('-')[0]
  return Array.from({ length: 12 }, (_, i) => {
    const mStr = `${yearStr}-${String(i + 1).padStart(2, '0')}-01`
    const mFrom = localMidnight(mStr, timezone)
    const nextMStr =
      i < 11 ? `${yearStr}-${String(i + 2).padStart(2, '0')}-01` : `${parseInt(yearStr) + 1}-01-01`
    const mTo = new Date(localMidnight(nextMStr, timezone).getTime() - 1)
    return { label: MONTHS[i], dateKey: fmtDate(mFrom), from: mFrom, to: mTo }
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
  const session = await getUserSession()
  const empty: TrophyAnalyticsResult = { periodLabel: '', points: [], total: 0, claimed: [] }
  if (!session?.user?.id) return empty

  const userId = session.user.id
  const timezone = (session.user as any).timezone || 'UTC'

  const payload = await getPayload({ config })

  const { docs: habits } = await payload.find({
    collection: 'habits',
    where: { userId: { equals: userId } },
    limit: 0,
  })

  if (habits.length === 0) return empty

  const { from, to } = getPeriodRange(period, offset, timezone)
  const periodLabel = getPeriodLabel(period, from, to, timezone)
  const buckets = getBuckets(period, from, to, timezone)

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
