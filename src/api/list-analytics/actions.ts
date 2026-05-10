'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

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

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function getDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
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

  const payload = await getPayload({ config })
  const now = new Date()

  let seriesStart: Date
  let seriesEnd: Date
  let points: { date: Date; label: string }[] = []

  if (period === 'day') {
    const target = addDays(startOfDay(now), offset)
    seriesStart = target
    seriesEnd = endOfDay(target)
    points = Array.from({ length: 24 }, (_, h) => {
      const d = new Date(target)
      d.setHours(h, 0, 0, 0)
      return {
        date: d,
        label: `${String(h).padStart(2, '0')}:00`,
      }
    })
  } else if (period === 'week') {
    const monday = new Date(now)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + offset * 7)
    monday.setHours(0, 0, 0, 0)
    seriesStart = monday
    seriesEnd = endOfDay(addDays(monday, 6))
    points = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i)
      return { date: d, label: getDayLabel(d) }
    })
  } else {
    const target = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0)
    seriesStart = startOfDay(target)
    seriesEnd = endOfDay(lastDay)
    points = Array.from({ length: lastDay.getDate() }, (_, i) => {
      const d = new Date(target.getFullYear(), target.getMonth(), i + 1)
      return { date: d, label: getDayLabel(d) }
    })
  }

  const donutEnd = endOfDay(now)
  const donutStart = startOfDay(addDays(now, -6))

  const { docs: userTags } = await payload.find({
    collection: 'user-tags',
    where: { userId: { equals: userId } },
    limit: 0,
  })

  const customTagMap: Record<string, { label: string; color: string }> = {}
  userTags.forEach((t) => {
    customTagMap[String(t.id)] = { label: t.name, color: t.color }
  })

  const fetchStart =
    period === 'day'
      ? donutStart < seriesStart
        ? donutStart
        : seriesStart
      : donutStart < seriesStart
        ? donutStart
        : seriesStart

  const { docs: completedTasks } = await payload.find({
    collection: 'tasks',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { status: { equals: 'completed' } },
        { completedAt: { greater_than_equal: fetchStart.toISOString() } },
        {
          completedAt: {
            less_than_equal:
              Math.max(donutEnd.getTime(), seriesEnd.getTime()) === donutEnd.getTime()
                ? donutEnd.toISOString()
                : seriesEnd.toISOString(),
          },
        },
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

  const getTagLabel = (tagId: string): string => {
    if (tagId === '__no_tag__') return 'No tag'
    if (SYSTEM_TAG_LABELS[tagId]) return SYSTEM_TAG_LABELS[tagId]
    return customTagMap[tagId]?.label ?? tagId
  }

  const getTagColor = (tagId: string): string => {
    if (tagId === '__no_tag__') return '#6b7280'
    if (SYSTEM_TAG_COLORS[tagId]) return SYSTEM_TAG_COLORS[tagId]
    return customTagMap[tagId]?.color ?? '#8b5cf6'
  }

  const donutTasks = completedTasks.filter((t) => {
    if (!t.completedAt) return false
    const d = new Date(t.completedAt)
    return d >= donutStart && d <= donutEnd
  })

  const donutMap: Record<string, number> = {}
  donutTasks.forEach((task) => {
    getTagIds(task).forEach((tagId) => {
      donutMap[tagId] = (donutMap[tagId] ?? 0) + 1
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
    const d = new Date(t.completedAt)
    return d >= seriesStart && d <= seriesEnd
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

  const series: DailyPoint[] = points.map(({ date, label }) => {
    let pointStart: Date
    let pointEnd: Date

    if (period === 'day') {
      pointStart = new Date(date)
      pointEnd = new Date(date)
      pointEnd.setMinutes(59, 59, 999)
    } else {
      pointStart = startOfDay(date)
      pointEnd = endOfDay(date)
    }

    const byTag: Record<string, number> = {}
    let total = 0

    seriesTasks.forEach((task) => {
      if (!task.completedAt) return
      const completedDate = new Date(task.completedAt)
      if (completedDate < pointStart || completedDate > pointEnd) return
      getTagIds(task).forEach((tagId) => {
        byTag[tagId] = (byTag[tagId] ?? 0) + 1
        total++
      })
    })

    return { date: formatDateKey(date), label, byTag, total }
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
