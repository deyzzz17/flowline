'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Pool } from 'pg'

const getSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

const SYSTEM_TAG_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  work: '#3b82f6',
  personal: '#8b5cf6',
  health: '#10b981',
  finance: '#f59e0b',
  learning: '#0ea5e9',
}

const SYSTEM_TAG_LABELS: Record<string, string> = {
  urgent: 'Urgent',
  work: 'Work',
  personal: 'Personal',
  health: 'Health',
  finance: 'Finance',
  learning: 'Learning',
}

export interface TagStat {
  id: string
  label: string
  color: string
  count: number
  isCustom: boolean
}

export interface DailyPoint {
  date: string
  label: string
  byTag: Record<string, number>
  total: number
}

export interface ListAnalyticsData {
  donut: TagStat[]
  totalCompleted: number
  series: DailyPoint[]
  seriesTags: { id: string; label: string; color: string }[]
  period: 'day' | 'week' | 'month'
  periodStart: string
  periodEnd: string
}

function localToUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timezone: string,
): Date {
  const str = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  const utcStr = new Date(str + 'Z').toLocaleString('en-US', { timeZone: timezone })
  const utcDate = new Date(str + 'Z')
  const localDate = new Date(utcStr)
  const offset = utcDate.getTime() - localDate.getTime()
  return new Date(utcDate.getTime() + offset)
}

function startOfDayUTC(year: number, month: number, day: number, timezone: string): Date {
  return localToUTC(year, month, day, 0, 0, 0, timezone)
}

function endOfDayUTC(year: number, month: number, day: number, timezone: string): Date {
  const start = startOfDayUTC(year, month, day, timezone)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function addDaysToYMD(
  year: number,
  month: number,
  day: number,
  n: number,
): { year: number; month: number; day: number } {
  const d = new Date(year, month - 1, day + n)
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
}

function getNowInTz(timezone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0')
  return { year: get('year'), month: get('month'), day: get('day') }
}

export const getListAnalytics = async (
  period: 'day' | 'week' | 'month' = 'week',
  offset: number = 0,
): Promise<ListAnalyticsData> => {
  const userId = await getSession()
  if (!userId)
    return {
      donut: [],
      totalCompleted: 0,
      series: [],
      seriesTags: [],
      period,
      periodStart: '',
      periodEnd: '',
    }

  let userTimezone = 'UTC'
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    try {
      const { rows } = await pool.query('SELECT timezone FROM "user" WHERE id = $1', [userId])
      userTimezone = rows[0]?.timezone ?? 'UTC'
    } finally {
      await pool.end()
    }
  } catch {}

  const payload = await getPayload({ config })
  const nowLocal = getNowInTz(userTimezone)

  type YMD = { year: number; month: number; day: number }
  let seriesStartYMD: YMD
  let seriesEndYMD: YMD
  let points: { ymd: YMD; label: string }[] = []

  if (period === 'day') {
    const target = addDaysToYMD(nowLocal.year, nowLocal.month, nowLocal.day, offset)
    seriesStartYMD = target
    seriesEndYMD = target
    points = Array.from({ length: 24 }, (_, h) => ({
      ymd: target,
      label: `${String(h).padStart(2, '0')}:00`,
      hour: h,
    })) as any
  } else if (period === 'week') {
    const todayJS = new Date(nowLocal.year, nowLocal.month - 1, nowLocal.day)
    const dayOfWeek = todayJS.getDay()
    const mondayOffset = (dayOfWeek + 6) % 7 
    const mondayJS = new Date(todayJS)
    mondayJS.setDate(mondayJS.getDate() - mondayOffset + offset * 7)
    const sundayJS = new Date(mondayJS)
    sundayJS.setDate(sundayJS.getDate() + 6)

    seriesStartYMD = {
      year: mondayJS.getFullYear(),
      month: mondayJS.getMonth() + 1,
      day: mondayJS.getDate(),
    }
    seriesEndYMD = {
      year: sundayJS.getFullYear(),
      month: sundayJS.getMonth() + 1,
      day: sundayJS.getDate(),
    }

    points = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mondayJS)
      d.setDate(d.getDate() + i)
      const ymd = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
      return {
        ymd,
        label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      }
    })
  } else {
    const firstJS = new Date(nowLocal.year, nowLocal.month - 1 + offset, 1)
    const lastJS = new Date(firstJS.getFullYear(), firstJS.getMonth() + 1, 0)
    seriesStartYMD = { year: firstJS.getFullYear(), month: firstJS.getMonth() + 1, day: 1 }
    seriesEndYMD = {
      year: lastJS.getFullYear(),
      month: lastJS.getMonth() + 1,
      day: lastJS.getDate(),
    }

    points = Array.from({ length: lastJS.getDate() }, (_, i) => {
      const d = new Date(firstJS.getFullYear(), firstJS.getMonth(), i + 1)
      const ymd = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
      return {
        ymd,
        label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      }
    })
  }

  const seriesStartUTC = startOfDayUTC(
    seriesStartYMD.year,
    seriesStartYMD.month,
    seriesStartYMD.day,
    userTimezone,
  )
  const seriesEndUTC = endOfDayUTC(
    seriesEndYMD.year,
    seriesEndYMD.month,
    seriesEndYMD.day,
    userTimezone,
  )

  const sevenDaysAgoYMD = addDaysToYMD(nowLocal.year, nowLocal.month, nowLocal.day, -6)
  const donutStartUTC = startOfDayUTC(
    sevenDaysAgoYMD.year,
    sevenDaysAgoYMD.month,
    sevenDaysAgoYMD.day,
    userTimezone,
  )
  const donutEndUTC = endOfDayUTC(nowLocal.year, nowLocal.month, nowLocal.day, userTimezone)

  const fetchStartUTC = donutStartUTC < seriesStartUTC ? donutStartUTC : seriesStartUTC
  const fetchEndUTC = donutEndUTC > seriesEndUTC ? donutEndUTC : seriesEndUTC

  const { docs: userTags } = await payload.find({
    collection: 'user-tags',
    where: { userId: { equals: userId } },
    limit: 0,
  })

  const customTagMap: Record<string, { label: string; color: string }> = {}
  userTags.forEach((t) => {
    customTagMap[String(t.id)] = { label: t.name, color: t.color }
  })

  const { docs: completedTasks } = await payload.find({
    collection: 'tasks',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { status: { equals: 'completed' } },
        { completedAt: { greater_than_equal: fetchStartUTC.toISOString() } },
        { completedAt: { less_than_equal: fetchEndUTC.toISOString() } },
      ],
    },
  })

  const getTagIds = (task: (typeof completedTasks)[0]): string[] => {
    const systemTags = (task.tags ?? []) as string[]
    const customTagIds = (task.customTags ?? []).map((t) =>
      typeof t === 'object' ? String(t.id) : String(t),
    )
    if (systemTags.length === 0 && customTagIds.length === 0) return ['__no_tag__']
    return [...systemTags, ...customTagIds]
  }

  const getTagLabel = (tagId: string) => {
    if (tagId === '__no_tag__') return 'No tag'
    return SYSTEM_TAG_LABELS[tagId] ?? customTagMap[tagId]?.label ?? tagId
  }

  const getTagColor = (tagId: string) => {
    if (tagId === '__no_tag__') return '#6b7280'
    return SYSTEM_TAG_COLORS[tagId] ?? customTagMap[tagId]?.color ?? '#8b5cf6'
  }

  const inRange = (completedAt: string, startUTC: Date, endUTC: Date) => {
    const t = new Date(completedAt).getTime()
    return t >= startUTC.getTime() && t <= endUTC.getTime()
  }

  const donutTasks = completedTasks.filter(
    (t) => t.completedAt && inRange(t.completedAt as string, donutStartUTC, donutEndUTC),
  )

  const donutMap: Record<string, number> = {}
  donutTasks.forEach((task) => {
    getTagIds(task).forEach((id) => {
      donutMap[id] = (donutMap[id] ?? 0) + 1
    })
  })

  const donut: TagStat[] = Object.entries(donutMap)
    .map(([id, count]) => ({
      id,
      label: getTagLabel(id),
      color: getTagColor(id),
      count,
      isCustom: !!customTagMap[id],
    }))
    .sort((a, b) => b.count - a.count)

  const seriesTasks = completedTasks.filter(
    (t) => t.completedAt && inRange(t.completedAt as string, seriesStartUTC, seriesEndUTC),
  )

  const allTagIds = new Set<string>()
  seriesTasks.forEach((task) => getTagIds(task).forEach((id) => allTagIds.add(id)))

  const seriesTags = Array.from(allTagIds).map((id) => ({
    id,
    label: getTagLabel(id),
    color: getTagColor(id),
  }))

  const series: DailyPoint[] = points.map((point: any) => {
    const { ymd } = point
    let pointStartUTC: Date
    let pointEndUTC: Date

    if (period === 'day') {
      const h = point.hour ?? 0
      pointStartUTC = localToUTC(ymd.year, ymd.month, ymd.day, h, 0, 0, userTimezone)
      pointEndUTC = new Date(pointStartUTC.getTime() + 60 * 60 * 1000 - 1)
    } else {
      pointStartUTC = startOfDayUTC(ymd.year, ymd.month, ymd.day, userTimezone)
      pointEndUTC = endOfDayUTC(ymd.year, ymd.month, ymd.day, userTimezone)
    }

    const byTag: Record<string, number> = {}
    let total = 0

    seriesTasks.forEach((task) => {
      if (!task.completedAt) return
      if (!inRange(task.completedAt as string, pointStartUTC, pointEndUTC)) return
      getTagIds(task).forEach((tagId) => {
        byTag[tagId] = (byTag[tagId] ?? 0) + 1
        total++
      })
    })

    return { date: formatDateKey(ymd.year, ymd.month, ymd.day), label: point.label, byTag, total }
  })

  return {
    donut,
    totalCompleted: donutTasks.length,
    series,
    seriesTags,
    period,
    periodStart: seriesStartUTC.toISOString(),
    periodEnd: seriesEndUTC.toISOString(),
  }
}
