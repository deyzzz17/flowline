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
  taskId?: number | null
  taskTitle?: string
  rating?: number
  taskCompleted?: boolean
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
        startedAt: new Date().toISOString(),
        duration: data.duration,
        categoryName: data.categoryName,
        categoryColor: data.categoryColor ?? '#8b5cf6',
        subCategory: data.subCategory,
        taskId: data.taskId ?? undefined,
        taskTitle: data.taskTitle,
        rating: data.rating,
        taskCompleted: data.taskCompleted ?? false,
      },
    })
    return ok(session)
  } catch {
    return err('Error creating session')
  }
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'year'

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

export interface SessionAnalytics {
  timeByCategory: { name: string; color: string; seconds: number }[]
  timeBySubcategory: { name: string; category: string; color: string; seconds: number }[]
  allCategories: { name: string; color: string }[]
  totalSessions: number
  totalSeconds: number
  avgSessionSeconds: number
  focusQuality: {
    global: { avgRating: number; sessions: number }
    byCategory: { name: string; color: string; avgRating: number; sessions: number }[]
  }
}

function emptyAnalytics(): SessionAnalytics {
  return {
    timeByCategory: [],
    timeBySubcategory: [],
    allCategories: [],
    totalSessions: 0,
    totalSeconds: 0,
    avgSessionSeconds: 0,
    focusQuality: { global: { avgRating: 0, sessions: 0 }, byCategory: [] },
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

  const catMap = new Map<string, { color: string; seconds: number }>()
  for (const s of sessions) {
    if (!s.categoryName) continue
    const existing = catMap.get(s.categoryName)
    if (existing) existing.seconds += s.duration
    else catMap.set(s.categoryName, { color: s.categoryColor ?? '#8b5cf6', seconds: s.duration })
  }
  const timeByCategory = Array.from(catMap.entries())
    .map(([name, v]) => ({ name, color: v.color, seconds: v.seconds }))
    .sort((a, b) => b.seconds - a.seconds)

  const subMap = new Map<string, { category: string; color: string; seconds: number }>()
  for (const s of sessions) {
    if (!s.subCategory || !s.categoryName) continue
    const key = `${s.categoryName}::${s.subCategory}`
    const existing = subMap.get(key)
    if (existing) existing.seconds += s.duration
    else
      subMap.set(key, {
        category: s.categoryName,
        color: s.categoryColor ?? '#8b5cf6',
        seconds: s.duration,
      })
  }
  const timeBySubcategory = Array.from(subMap.entries())
    .map(([key, v]) => ({
      name: key.split('::')[1],
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
      allCatMap.set(s.categoryName, s.categoryColor ?? '#8b5cf6')
    }
  }
  const allCategories = Array.from(allCatMap.entries()).map(([name, color]) => ({ name, color }))

  const totalSessions = sessions.length
  const totalSeconds = sessions.reduce((s, d) => s + d.duration, 0)
  const avgSessionSeconds = totalSessions > 0 ? Math.round(totalSeconds / totalSessions) : 0

  const ratedSessions = sessions.filter((s) => s.rating && s.rating > 0)
  const globalAvg =
    ratedSessions.length > 0
      ? ratedSessions.reduce((s, d) => s + (d.rating ?? 0), 0) / ratedSessions.length
      : 0

  const qualityByCat = new Map<string, { color: string; total: number; count: number }>()
  for (const s of ratedSessions) {
    if (!s.categoryName || !s.rating) continue
    const existing = qualityByCat.get(s.categoryName)
    if (existing) {
      existing.total += s.rating
      existing.count++
    } else
      qualityByCat.set(s.categoryName, {
        color: s.categoryColor ?? '#8b5cf6',
        total: s.rating,
        count: 1,
      })
  }
  const byCategory = Array.from(qualityByCat.entries()).map(([name, v]) => ({
    name,
    color: v.color,
    avgRating: Math.round((v.total / v.count) * 10) / 10,
    sessions: v.count,
  }))

  return {
    timeByCategory,
    timeBySubcategory,
    allCategories,
    totalSessions,
    totalSeconds,
    avgSessionSeconds,
    focusQuality: {
      global: { avgRating: Math.round(globalAvg * 10) / 10, sessions: ratedSessions.length },
      byCategory,
    },
  }
}
