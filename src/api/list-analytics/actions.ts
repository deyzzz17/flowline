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

function toLocalDate(utcDate: Date, timezone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(utcDate)

  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0')
  return new Date(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function getNowInTz(timezone: string): { year: number; month: number; day: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0')
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') }
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

  let seriesStart: Date
  let seriesEnd: Date
  let points: { localDate: Date; label: string }[] = []

  if (period === 'day') {
    const targetLocal = new Date(nowLocal.year, nowLocal.month - 1, nowLocal.day + offset)
    seriesStart = new Date(
      `${targetLocal.getFullYear()}-${String(targetLocal.getMonth() + 1).padStart(2, '0')}-${String(targetLocal.getDate()).padStart(2, '0')}T00:00:00`,
    )
    points = Array.from({ length: 24 }, (_, h) => {
      const d = new Date(targetLocal)
      d.setHours(h, 0, 0, 0)
      return { localDate: d, label: `${String(h).padStart(2, '0')}:00` }
    })
    seriesEnd = new Date(targetLocal)
    seriesEnd.setHours(23, 59, 59, 999)
  } else if (period === 'week') {
    const todayLocal = new Date(nowLocal.year, nowLocal.month - 1, nowLocal.day)
    const dayOfWeek = todayLocal.getDay()
    const mondayOffset = (dayOfWeek + 6) % 7
    const monday = new Date(todayLocal)
    monday.setDate(monday.getDate() - mondayOffset + offset * 7)
    monday.setHours(0, 0, 0, 0)
    seriesStart = monday
    const sunday = addDays(monday, 6)
    sunday.setHours(23, 59, 59, 999)
    seriesEnd = sunday
    points = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i)
      return {
        localDate: d,
        label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      }
    })
  } else {
    const firstDay = new Date(nowLocal.year, nowLocal.month - 1 + offset, 1)
    const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)
    firstDay.setHours(0, 0, 0, 0)
    lastDay.setHours(23, 59, 59, 999)
    seriesStart = firstDay
    seriesEnd = lastDay
    points = Array.from({ length: lastDay.getDate() }, (_, i) => {
      const d = new Date(firstDay.getFullYear(), firstDay.getMonth(), i + 1)
      return {
        localDate: d,
        label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      }
    })
  }

  const todayLocal = new Date(nowLocal.year, nowLocal.month - 1, nowLocal.day, 23, 59, 59, 999)
  const sevenDaysAgoLocal = new Date(
    nowLocal.year,
    nowLocal.month - 1,
    nowLocal.day - 6,
    0,
    0,
    0,
    0,
  )

  const fetchStart = sevenDaysAgoLocal < seriesStart ? sevenDaysAgoLocal : seriesStart
  const fetchEnd = todayLocal > seriesEnd ? todayLocal : seriesEnd

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
        { completedAt: { greater_than_equal: fetchStart.toISOString() } },
        { completedAt: { less_than_equal: fetchEnd.toISOString() } },
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

  const getLocalDate = (completedAt: string): Date =>
    toLocalDate(new Date(completedAt), userTimezone)

  const donutTasks = completedTasks.filter((t) => {
    if (!t.completedAt) return false
    const local = getLocalDate(t.completedAt as string)
    return local >= sevenDaysAgoLocal && local <= todayLocal
  })

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

  const seriesTasks = completedTasks.filter((t) => {
    if (!t.completedAt) return false
    const local = getLocalDate(t.completedAt as string)
    return local >= seriesStart && local <= seriesEnd
  })

  const allTagIds = new Set<string>()
  seriesTasks.forEach((task) => {
    getTagIds(task).forEach((id) => allTagIds.add(id))
  })

  const seriesTags = Array.from(allTagIds).map((id) => ({
    id,
    label: getTagLabel(id),
    color: getTagColor(id),
  }))

  const series: DailyPoint[] = points.map(({ localDate, label }) => {
    let pointStart: Date
    let pointEnd: Date

    if (period === 'day') {
      pointStart = new Date(localDate)
      pointEnd = new Date(localDate)
      pointEnd.setMinutes(59, 59, 999)
    } else {
      pointStart = new Date(localDate)
      pointStart.setHours(0, 0, 0, 0)
      pointEnd = new Date(localDate)
      pointEnd.setHours(23, 59, 59, 999)
    }

    const byTag: Record<string, number> = {}
    let total = 0

    seriesTasks.forEach((task) => {
      if (!task.completedAt) return
      const local = getLocalDate(task.completedAt as string)
      if (local < pointStart || local > pointEnd) return
      getTagIds(task).forEach((tagId) => {
        byTag[tagId] = (byTag[tagId] ?? 0) + 1
        total++
      })
    })

    return { date: formatDateKey(localDate), label, byTag, total }
  })

  return {
    donut,
    totalCompleted: donutTasks.length,
    series,
    seriesTags,
    period,
    periodStart: seriesStart.toISOString(),
    periodEnd: seriesEnd.toISOString(),
  }
}
