'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ok, err } from '@/types/result'

const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#6366f1' },
  { name: 'Study', color: '#0ea5e9' },
  { name: 'Health', color: '#10b981' },
  { name: 'Personal', color: '#f59e0b' },
  { name: 'Creative', color: '#ec4899' },
]

const getUserId = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export const listTimerCategories = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'timer-categories',
    where: { userId: { equals: userId } },
    limit: 0,
  })

  if (existing.docs.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await payload.create({
        collection: 'timer-categories',
        data: { ...cat, userId, isDefault: true },
      })
    }
    return await payload.find({
      collection: 'timer-categories',
      where: { userId: { equals: userId } },
      limit: 0,
    })
  }

  return existing
}

export const createTimerCategory = async (data: { name: string; color: string }) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const category = await payload.create({
      collection: 'timer-categories',
      data: { ...data, userId, isDefault: false },
    })
    return ok(category)
  } catch {
    return err('Error creating category')
  }
}

export const deleteTimerCategory = async (id: number) => {
  try {
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'timer-categories', id })
    return ok(true)
  } catch {
    return err('Error deleting category')
  }
}

export interface CreateSessionData {
  duration: number
  categoryName?: string
  categoryColor?: string
  subCategory?: string
  subCategoryColor?: string
  taskId?: number | null
  taskTitle?: string
  rating?: number
  taskCompleted?: boolean
  startedAt?: string
  timezoneOffset?: number
}

export const createTimerSession = async (data: CreateSessionData) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const session = await payload.create({
      collection: 'timer-sessions',
      data: {
        userId,
        startedAt: data.startedAt ?? new Date().toISOString(),
        duration: data.duration,
        categoryName: data.categoryName,
        categoryColor: data.categoryColor ?? '#8b5cf6',
        subCategory: data.subCategory,
        subCategoryColor: data.subCategoryColor,
        taskId: data.taskId ?? undefined,
        taskTitle: data.taskTitle,
        rating: data.rating,
        taskCompleted: data.taskCompleted ?? false,
        timezoneOffset: data.timezoneOffset ?? 0,
      },
    })
    return ok(session)
  } catch {
    return err('Error creating session')
  }
}

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
}

function emptyAnalytics(): SessionAnalytics {
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
  }
}

function getPeriodStart(period: AnalyticsPeriod): Date {
  const now = new Date()
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - d.getDay())
      d.setHours(0, 0, 0, 0)
      return d
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'year':
      return new Date(now.getFullYear(), 0, 1)
  }
}

function getTimeLabels(
  period: AnalyticsPeriod,
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
      return Array.from({ length: 7 }, (_, i) => ({
        label: days[i],
        timestamp: i,
        key: String(i),
      }))
    }
    case 'month': {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
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

export const getTimerAnalytics = async (period: AnalyticsPeriod): Promise<SessionAnalytics> => {
  const userId = await getUserId()
  if (!userId) return emptyAnalytics()

  const payload = await getPayload({ config })
  const periodStart = getPeriodStart(period)

  const { docs: sessions } = await payload.find({
    collection: 'timer-sessions',
    where: {
      and: [
        { userId: { equals: userId } },
        { startedAt: { greater_than_equal: periodStart.toISOString() } },
      ],
    },
    limit: 0,
  })

  if (sessions.length === 0) return emptyAnalytics()

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
  for (const s of sessions) {
    if (!s.categoryName) continue
    const color = resolveColor(s.categoryName, s.categoryColor)
    const existing = catMap.get(s.categoryName)
    if (existing) existing.seconds += s.duration
    else catMap.set(s.categoryName, { color, seconds: s.duration })
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
    if (s.categoryName && !allCatMap.has(s.categoryName)) {
      allCatMap.set(s.categoryName, resolveColor(s.categoryName, s.categoryColor))
    }
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
    if (!s.categoryName || !s.rating) continue
    const color = resolveColor(s.categoryName, s.categoryColor)
    const existing = qualityByCat.get(s.categoryName)
    if (existing) {
      existing.total += s.rating
      existing.count++
    } else qualityByCat.set(s.categoryName, { color, total: s.rating, count: 1 })
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

  const labels = getTimeLabels(period)
  const seriesMap = new Map<string, Map<string, number>>()
  for (const label of labels) seriesMap.set(label.key, new Map())

  for (const s of sessions) {
    const tzOffset = (s as any).timezoneOffset ?? 0
    const sessionKey = getSessionKey(s.startedAt, period, tzOffset)
    const point = seriesMap.get(sessionKey)
    if (!point) continue
    if (s.categoryName) {
      const catKey = `cat__${s.categoryName}`
      point.set(catKey, (point.get(catKey) ?? 0) + s.duration)
    }
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
    ([name, v]) => ({
      key: `rating__${name}`,
      name,
      color: v.color,
      type: 'category' as const,
    }),
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
  }
}

export interface SavedTimerConfig {
  id: number
  name: string
  sessionDuration: number
  workDuration: number
  breakDuration: number
  categoryName?: string
  categoryColor?: string
  subCategory?: string
}

export const listTimerConfigs = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  return payload.find({
    collection: 'timer-configs',
    where: { userId: { equals: userId } },
    sort: '-createdAt',
    limit: 50,
  })
}

export const saveTimerConfig = async (data: Omit<SavedTimerConfig, 'id'>) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const saved = await payload.create({
      collection: 'timer-configs',
      data: { ...data, userId },
    })
    return ok(saved)
  } catch {
    return err('Error saving config')
  }
}

export const deleteTimerConfig = async (id: number) => {
  try {
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'timer-configs', id })
    return ok(true)
  } catch {
    return err('Error deleting config')
  }
}
