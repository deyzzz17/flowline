'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Pool } from 'pg'
import { getSession } from '@/lib/get-session'
import { getCurrentWorkspaceId, workspaceWhereClause } from '@/lib/get-current-workspace'
import { getUserPlanLimits } from '@/lib/get-user-plan'
import { getAnalyticsWindowStart, clampToAnalyticsWindow } from '@/lib/analytics-window'

const getUserId = async () => {
  const session = await getSession()
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
  restrictedByPlan: boolean
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
  const userId = await getUserId()
  if (!userId)
    return {
      donut: [],
      totalCompleted: 0,
      series: [],
      seriesTags: [],
      period,
      periodStart: '',
      periodEnd: '',
      restrictedByPlan: false,
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
  let points: { ymd: YMD; label: string; hour?: number }[] = []

  if (period === 'day') {
    const target = addDaysToYMD(nowLocal.year, nowLocal.month, nowLocal.day, offset)
    seriesStartYMD = target
    seriesEndYMD = target
    points = Array.from({ length: 24 }, (_, h) => ({
      ymd: target,
      label: `${String(h).padStart(2, '0')}:00`,
      hour: h,
    }))
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

  const { plan } = await getUserPlanLimits()
  const windowStart = getAnalyticsWindowStart(plan)
  const { fetchFrom: clampedSeriesStartUTC, restrictedByPlan } = clampToAnalyticsWindow(
    seriesStartUTC,
    windowStart,
  )

  const fetchStartUTC = donutStartUTC < clampedSeriesStartUTC ? donutStartUTC : clampedSeriesStartUTC
  const fetchEndUTC = donutEndUTC > seriesEndUTC ? donutEndUTC : seriesEndUTC

  const workspaceId = await getCurrentWorkspaceId()

  const { docs: completions } = await payload.find({
    collection: 'task-completions',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { completedAt: { greater_than_equal: fetchStartUTC.toISOString() } },
        { completedAt: { less_than_equal: fetchEndUTC.toISOString() } },
        workspaceWhereClause(workspaceId),
      ],
    },
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
        workspaceWhereClause(workspaceId),
      ],
    },
  })

  const { docs: userTags } = await payload.find({
    collection: 'user-tags',
    where: { userId: { equals: userId } },
    limit: 0,
  })
  const customTagMap: Record<string, { label: string; color: string }> = {}
  userTags.forEach((t) => {
    customTagMap[String(t.id)] = { label: t.name, color: t.color }
  })

  type NormalizedCompletion = {
    completedAt: string
    tags: string[]
    customTags: { id: string; label: string; color: string }[]
  }

  const snapshotTaskIds = new Set(completions.map((c) => c.taskId))

  const allCompletions: NormalizedCompletion[] = [
    ...completions.map((c) => ({
      completedAt: c.completedAt as string,
      tags: (c.tags ?? []) as string[],
      customTags: ((c.customTagsSnapshot as any[]) ?? []).map((t: any) => ({
        id: String(t.id),
        label: t.name,
        color: t.color,
      })),
    })),
    ...completedTasks
      .filter((t) => !snapshotTaskIds.has(t.id))
      .map((t) => ({
        completedAt: t.completedAt as string,
        tags: (t.tags ?? []) as string[],
        customTags: (t.customTags ?? []).map((tag: any) => {
          const tagId = typeof tag === 'object' ? String(tag.id) : String(tag)
          const resolved = customTagMap[tagId]
          return {
            id: tagId,
            label: resolved?.label ?? tagId,
            color: resolved?.color ?? '#8b5cf6',
          }
        }),
      })),
  ]

  const getTagLabel = (tagId: string) =>
    SYSTEM_TAG_LABELS[tagId] ?? customTagMap[tagId]?.label ?? tagId

  const getTagColor = (tagId: string) =>
    SYSTEM_TAG_COLORS[tagId] ?? customTagMap[tagId]?.color ?? '#8b5cf6'

  const getTagIds = (c: NormalizedCompletion): string[] => {
    const systemTags = c.tags
    const customTagIds = c.customTags.map((t) => t.id)
    if (systemTags.length === 0 && customTagIds.length === 0) return ['__no_tag__']
    return [...systemTags, ...customTagIds]
  }

  const getTagLabelFromCompletion = (tagId: string, c: NormalizedCompletion): string => {
    if (tagId === '__no_tag__') return 'No tag'
    if (SYSTEM_TAG_LABELS[tagId]) return SYSTEM_TAG_LABELS[tagId]
    const custom = c.customTags.find((t) => t.id === tagId)
    if (custom) return custom.label
    return customTagMap[tagId]?.label ?? tagId
  }

  const getTagColorFromCompletion = (tagId: string, c: NormalizedCompletion): string => {
    if (tagId === '__no_tag__') return '#6b7280'
    if (SYSTEM_TAG_COLORS[tagId]) return SYSTEM_TAG_COLORS[tagId]
    const custom = c.customTags.find((t) => t.id === tagId)
    if (custom) return custom.color
    return customTagMap[tagId]?.color ?? '#8b5cf6'
  }

  const inRange = (completedAt: string, startUTC: Date, endUTC: Date) => {
    const t = new Date(completedAt).getTime()
    return t >= startUTC.getTime() && t <= endUTC.getTime()
  }

  const donutCompletions = allCompletions.filter(
    (c) => c.completedAt && inRange(c.completedAt, donutStartUTC, donutEndUTC),
  )

  const donutMap: Record<string, { count: number; label: string; color: string }> = {}
  donutCompletions.forEach((c) => {
    getTagIds(c).forEach((id) => {
      if (!donutMap[id]) {
        donutMap[id] = {
          count: 0,
          label: getTagLabelFromCompletion(id, c),
          color: getTagColorFromCompletion(id, c),
        }
      }
      donutMap[id].count++
    })
  })

  const donut: TagStat[] = Object.entries(donutMap)
    .map(([id, v]) => ({
      id,
      label: v.label,
      color: v.color,
      count: v.count,
      isCustom: !SYSTEM_TAG_LABELS[id] && id !== '__no_tag__',
    }))
    .sort((a, b) => b.count - a.count)

  const seriesCompletions = allCompletions.filter(
    (c) => c.completedAt && inRange(c.completedAt, seriesStartUTC, seriesEndUTC),
  )

  const allTagIds = new Set<string>()
  seriesCompletions.forEach((c) => getTagIds(c).forEach((id) => allTagIds.add(id)))

  const seriesTags = Array.from(allTagIds).map((id) => {
    const firstCompletion = seriesCompletions.find((c) => getTagIds(c).includes(id))
    return {
      id,
      label: firstCompletion ? getTagLabelFromCompletion(id, firstCompletion) : getTagLabel(id),
      color: firstCompletion ? getTagColorFromCompletion(id, firstCompletion) : getTagColor(id),
    }
  })

  const series: DailyPoint[] = points.map((point) => {
    const { ymd } = point
    let pointStartUTC: Date
    let pointEndUTC: Date

    if (period === 'day' && point.hour !== undefined) {
      pointStartUTC = localToUTC(ymd.year, ymd.month, ymd.day, point.hour, 0, 0, userTimezone)
      pointEndUTC = new Date(pointStartUTC.getTime() + 60 * 60 * 1000 - 1)
    } else {
      pointStartUTC = startOfDayUTC(ymd.year, ymd.month, ymd.day, userTimezone)
      pointEndUTC = endOfDayUTC(ymd.year, ymd.month, ymd.day, userTimezone)
    }

    const byTag: Record<string, number> = {}
    let total = 0

    seriesCompletions.forEach((c) => {
      if (!c.completedAt) return
      if (!inRange(c.completedAt, pointStartUTC, pointEndUTC)) return
      getTagIds(c).forEach((tagId) => {
        byTag[tagId] = (byTag[tagId] ?? 0) + 1
        total++
      })
    })

    return { date: formatDateKey(ymd.year, ymd.month, ymd.day), label: point.label, byTag, total }
  })

  return {
    donut,
    totalCompleted: donutCompletions.length,
    series,
    seriesTags,
    period,
    periodStart: seriesStartUTC.toISOString(),
    periodEnd: seriesEndUTC.toISOString(),
    restrictedByPlan,
  }
}
