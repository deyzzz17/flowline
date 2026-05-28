'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getUserId } from '../timer/actions'

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'year'

export interface TimeSeriesPoint {
  label: string
  timestamp: number
  [key: string]: number | string
}

export interface SeriesDefinition {
  key: string
  name: string
  color: string
  type: 'category' | 'subcategory'
  parentCategory?: string
}

export interface SessionAnalytics {
  timeByCategory: { name: string; color: string; seconds: number }[]
  timeBySubcategory: { name: string; category: string; color: string; seconds: number }[]
  allCategories: { name: string; color: string }[]
  totalSessions: number
  totalSeconds: number
  avgSessionSeconds: number
  longestSessionSeconds: number
  timeSeries: TimeSeriesPoint[]
  seriesDefinitions: SeriesDefinition[]
  focusQuality: {
    global: { avgRating: number; sessions: number }
    byCategory: { name: string; color: string; avgRating: number; sessions: number }[]
    bySubcategory: {
      name: string
      category: string
      color: string
      avgRating: number
      sessions: number
    }[]
  }
  focusQualityTimeSeries: TimeSeriesPoint[]
  focusQualitySeriesDefinitions: SeriesDefinition[]
  focusQualitySubTimeSeries: TimeSeriesPoint[]
  focusQualitySubSeriesDefinitions: SeriesDefinition[]
  periodLabel: string
}

function emptyAnalytics(periodLabel: string): SessionAnalytics {
  return {
    timeByCategory: [],
    timeBySubcategory: [],
    allCategories: [],
    totalSessions: 0,
    totalSeconds: 0,
    avgSessionSeconds: 0,
    longestSessionSeconds: 0,
    timeSeries: [],
    seriesDefinitions: [],
    focusQuality: { global: { avgRating: 0, sessions: 0 }, byCategory: [], bySubcategory: [] },
    focusQualityTimeSeries: [],
    focusQualitySeriesDefinitions: [],
    focusQualitySubTimeSeries: [],
    focusQualitySubSeriesDefinitions: [],
    periodLabel,
  }
}

function getPeriodRange(
  period: AnalyticsPeriod,
  offset: number,
): { start: Date; end: Date; label: string } {
  const now = new Date()

  switch (period) {
    case 'day': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
      const start = new Date(d)
      start.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)
      const label =
        offset === 0
          ? 'Today'
          : offset === -1
            ? 'Yesterday'
            : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      return { start, end, label }
    }
    case 'week': {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + offset * 7)
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      const label =
        offset === 0
          ? 'This week'
          : offset === -1
            ? 'Last week'
            : `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      return { start: startOfWeek, end: endOfWeek, label }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
      end.setHours(23, 59, 59, 999)
      const label =
        offset === 0
          ? 'This month'
          : start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      return { start, end, label }
    }
    case 'year': {
      const year = now.getFullYear() + offset
      const start = new Date(year, 0, 1)
      const end = new Date(year, 11, 31, 23, 59, 59, 999)
      const label = offset === 0 ? 'This year' : String(year)
      return { start, end, label }
    }
  }
}

function getTimeLabels(
  period: AnalyticsPeriod,
  offset: number,
): { label: string; timestamp: number; key: string }[] {
  const now = new Date()
  switch (period) {
    case 'day':
      return Array.from({ length: 24 }, (_, h) => ({
        label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
        timestamp: h,
        key: String(h),
      }))
    case 'week': {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return Array.from({ length: 7 }, (_, i) => ({ label: days[i], timestamp: i, key: String(i) }))
    }
    case 'month': {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0).getDate()
      return Array.from({ length: daysInMonth }, (_, i) => ({
        label: String(i + 1),
        timestamp: i + 1,
        key: String(i + 1),
      }))
    }
    case 'year': {
      const months = [
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
      return months.map((m, i) => ({ label: m, timestamp: i, key: String(i) }))
    }
  }
}

function getSessionKey(startedAt: string, period: AnalyticsPeriod, timezoneOffset = 0): string {
  const utcMs = new Date(startedAt).getTime()
  const localMs = utcMs - timezoneOffset * 60 * 1000
  const d = new Date(localMs)
  switch (period) {
    case 'day':
      return String(d.getUTCHours())
    case 'week':
      return String(d.getUTCDay())
    case 'month':
      return String(d.getUTCDate())
    case 'year':
      return String(d.getUTCMonth())
  }
}

export const getTimerAnalytics = async (
  period: AnalyticsPeriod,
  offset: number = 0,
): Promise<SessionAnalytics> => {
  const userId = await getUserId()
  const { start: periodStart, end: periodEnd, label: periodLabel } = getPeriodRange(period, offset)

  if (!userId) return emptyAnalytics(periodLabel)

  const payload = await getPayload({ config })

  const { docs: sessions } = await payload.find({
    collection: 'timer-sessions',
    where: {
      and: [
        { userId: { equals: userId } },
        { startedAt: { greater_than_equal: periodStart.toISOString() } },
        { startedAt: { less_than_equal: periodEnd.toISOString() } },
      ],
    },
    limit: 0,
  })

  if (sessions.length === 0) return emptyAnalytics(periodLabel)

  const { docs: userCategories } = await payload.find({
    collection: 'timer-categories',
    where: { userId: { equals: userId } },
    limit: 0,
  })
  const categoryColorMap = new Map(userCategories.map((c) => [c.name, c.color]))

  const resolveColor = (categoryName: string, sessionColor?: string | null): string => {
    if (sessionColor && sessionColor !== '#8b5cf6') return sessionColor
    return categoryColorMap.get(categoryName) ?? '#8b5cf6'
  }

  const catMap = new Map<string, { color: string; seconds: number }>()
  const NO_CATEGORY = 'No category'
  const NO_CATEGORY_COLOR = '#64748b'

  for (const s of sessions) {
    const name = s.categoryName || NO_CATEGORY
    const color = s.categoryName ? resolveColor(s.categoryName, s.categoryColor) : NO_CATEGORY_COLOR
    const existing = catMap.get(name)
    if (existing) existing.seconds += s.duration
    else catMap.set(name, { color, seconds: s.duration })
  }
  const timeByCategory = Array.from(catMap.entries())
    .map(([name, v]) => ({ name, color: v.color, seconds: v.seconds }))
    .sort((a, b) => b.seconds - a.seconds)

  const subMap = new Map<string, { category: string; color: string; seconds: number }>()
  for (const s of sessions) {
    if (!s.subCategory || !s.categoryName) continue
    const subKey = `${s.categoryName}::${s.subCategory}`
    const color = (s as any).subCategoryColor ?? resolveColor(s.categoryName, s.categoryColor)
    const existing = subMap.get(subKey)
    if (existing) existing.seconds += s.duration
    else subMap.set(subKey, { category: s.categoryName, color, seconds: s.duration })
  }
  const timeBySubcategory = Array.from(subMap.entries())
    .map(([k, v]) => ({
      name: k.split('::')[1],
      category: v.category,
      color: v.color,
      seconds: v.seconds,
    }))
    .sort((a, b) => b.seconds - a.seconds)

  const { docs: allSessions } = await payload.find({
    collection: 'timer-sessions',
    where: { userId: { equals: userId } },
    limit: 0,
  })
  const allCatMap = new Map<string, string>()
  for (const s of allSessions) {
    const name = s.categoryName || NO_CATEGORY
    const color = s.categoryName ? resolveColor(s.categoryName, s.categoryColor) : NO_CATEGORY_COLOR
    if (!allCatMap.has(name)) allCatMap.set(name, color)
  }
  const allCategories = Array.from(allCatMap.entries()).map(([name, color]) => ({ name, color }))

  const totalSessions = sessions.length
  const totalSeconds = sessions.reduce((s, d) => s + d.duration, 0)
  const avgSessionSeconds = totalSessions > 0 ? Math.round(totalSeconds / totalSessions) : 0
  const longestSessionSeconds =
    sessions.length > 0 ? Math.max(...sessions.map((s) => s.duration)) : 0

  const ratedSessions = sessions.filter((s) => s.rating && s.rating > 0)
  const globalAvg =
    ratedSessions.length > 0
      ? ratedSessions.reduce((s, d) => s + (d.rating ?? 0), 0) / ratedSessions.length
      : 0

  const qualityByCat = new Map<string, { color: string; total: number; count: number }>()
  for (const s of ratedSessions) {
    if (!s.rating) continue
    const name = s.categoryName || NO_CATEGORY
    const color = s.categoryName ? resolveColor(s.categoryName, s.categoryColor) : NO_CATEGORY_COLOR
    const existing = qualityByCat.get(name)
    if (existing) {
      existing.total += s.rating
      existing.count++
    } else qualityByCat.set(name, { color, total: s.rating, count: 1 })
  }
  const byCategory = Array.from(qualityByCat.entries()).map(([name, v]) => ({
    name,
    color: v.color,
    avgRating: Math.round((v.total / v.count) * 10) / 10,
    sessions: v.count,
  }))

  const qualityBySub = new Map<
    string,
    { category: string; color: string; total: number; count: number }
  >()
  for (const s of ratedSessions) {
    if (!s.subCategory || !s.categoryName || !s.rating) continue
    const k = `${s.categoryName}::${s.subCategory}`
    const color = (s as any).subCategoryColor ?? resolveColor(s.categoryName, s.categoryColor)
    const existing = qualityBySub.get(k)
    if (existing) {
      existing.total += s.rating
      existing.count++
    } else qualityBySub.set(k, { category: s.categoryName, color, total: s.rating, count: 1 })
  }
  const bySubcategory = Array.from(qualityBySub.entries()).map(([k, v]) => ({
    name: k.split('::')[1],
    category: v.category,
    color: v.color,
    avgRating: Math.round((v.total / v.count) * 10) / 10,
    sessions: v.count,
  }))

  const seriesDefinitions: SeriesDefinition[] = [
    ...Array.from(catMap.entries()).map(([name, v]) => ({
      key: `cat__${name}`,
      name,
      color: v.color,
      type: 'category' as const,
    })),
    ...Array.from(subMap.entries()).map(([k, v]) => ({
      key: `sub__${k}`,
      name: k.split('::')[1],
      color: v.color,
      type: 'subcategory' as const,
      parentCategory: k.split('::')[0],
    })),
  ]

  const labels = getTimeLabels(period, offset)
  const seriesMap = new Map<string, Map<string, number>>()
  for (const label of labels) seriesMap.set(label.key, new Map())

  for (const s of sessions) {
    const tzOffset = (s as any).timezoneOffset ?? 0
    const sessionKey = getSessionKey(s.startedAt, period, tzOffset)
    const point = seriesMap.get(sessionKey)
    if (!point) continue
    const catName = s.categoryName || NO_CATEGORY
    const catKey = `cat__${catName}`
    point.set(catKey, (point.get(catKey) ?? 0) + s.duration)
    if (s.subCategory && s.categoryName) {
      const subKey = `sub__${s.categoryName}::${s.subCategory}`
      point.set(subKey, (point.get(subKey) ?? 0) + s.duration)
    }
  }

  const timeSeries: TimeSeriesPoint[] = labels.map((label) => {
    const point = seriesMap.get(label.key) ?? new Map()
    const obj: TimeSeriesPoint = { label: label.label, timestamp: label.timestamp }
    for (const def of seriesDefinitions) obj[def.key] = point.get(def.key) ?? 0
    return obj
  })

  const focusQualitySeriesDefinitions: SeriesDefinition[] = Array.from(qualityByCat.entries()).map(
    ([name, v]) => ({ key: `rating__${name}`, name, color: v.color, type: 'category' as const }),
  )
  const ratingSeriesMap = new Map<string, Map<string, { total: number; count: number }>>()
  for (const label of labels) ratingSeriesMap.set(label.key, new Map())
  for (const s of ratedSessions) {
    if (!s.categoryName || !s.rating) continue
    const tzOffset = (s as any).timezoneOffset ?? 0
    const sessionKey = getSessionKey(s.startedAt, period, tzOffset)
    const point = ratingSeriesMap.get(sessionKey)
    if (!point) continue
    const catKey = `rating__${s.categoryName}`
    const existing = point.get(catKey)
    if (existing) {
      existing.total += s.rating
      existing.count++
    } else point.set(catKey, { total: s.rating, count: 1 })
  }
  const focusQualityTimeSeries: TimeSeriesPoint[] = labels.map((label) => {
    const point = ratingSeriesMap.get(label.key) ?? new Map()
    const obj: TimeSeriesPoint = { label: label.label, timestamp: label.timestamp }
    for (const def of focusQualitySeriesDefinitions) {
      const entry = point.get(def.key)
      obj[def.key] = entry ? Math.round((entry.total / entry.count) * 10) / 10 : 0
    }
    return obj
  })

  const focusQualitySubSeriesDefinitions: SeriesDefinition[] = Array.from(
    qualityBySub.entries(),
  ).map(([k, v]) => ({
    key: `rating_sub__${k}`,
    name: k.split('::')[1],
    color: v.color,
    type: 'subcategory' as const,
    parentCategory: k.split('::')[0],
  }))
  const ratingSubSeriesMap = new Map<string, Map<string, { total: number; count: number }>>()
  for (const label of labels) ratingSubSeriesMap.set(label.key, new Map())
  for (const s of ratedSessions) {
    if (!s.subCategory || !s.categoryName || !s.rating) continue
    const tzOffset = (s as any).timezoneOffset ?? 0
    const sessionKey = getSessionKey(s.startedAt, period, tzOffset)
    const point = ratingSubSeriesMap.get(sessionKey)
    if (!point) continue
    const subKey = `rating_sub__${s.categoryName}::${s.subCategory}`
    const existing = point.get(subKey)
    if (existing) {
      existing.total += s.rating
      existing.count++
    } else point.set(subKey, { total: s.rating, count: 1 })
  }
  const focusQualitySubTimeSeries: TimeSeriesPoint[] = labels.map((label) => {
    const point = ratingSubSeriesMap.get(label.key) ?? new Map()
    const obj: TimeSeriesPoint = { label: label.label, timestamp: label.timestamp }
    for (const def of focusQualitySubSeriesDefinitions) {
      const entry = point.get(def.key)
      obj[def.key] = entry ? Math.round((entry.total / entry.count) * 10) / 10 : 0
    }
    return obj
  })

  return {
    timeByCategory,
    timeBySubcategory,
    allCategories,
    totalSessions,
    totalSeconds,
    avgSessionSeconds,
    longestSessionSeconds,
    timeSeries,
    seriesDefinitions,
    focusQualityTimeSeries,
    focusQualitySeriesDefinitions,
    focusQualitySubTimeSeries,
    focusQualitySubSeriesDefinitions,
    focusQuality: {
      global: { avgRating: Math.round(globalAvg * 10) / 10, sessions: ratedSessions.length },
      byCategory,
      bySubcategory,
    },
    periodLabel,
  }
}
