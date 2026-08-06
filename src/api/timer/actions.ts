'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ok, err } from '@/types/result'
import { getSession } from '@/lib/get-session'
import { getUserPlanLimits } from '@/lib/get-user-plan'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'

const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#6366f1' },
  { name: 'Study', color: '#0ea5e9' },
  { name: 'Health', color: '#10b981' },
  { name: 'Personal', color: '#f59e0b' },
  { name: 'Creative', color: '#ec4899' },
]

export const getUserId = async () => {
  const session = await getSession()
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

    const { plan, limits } = await getUserPlanLimits()
    const { totalDocs } = await payload.find({
      collection: 'timer-categories',
      where: {
        and: [{ userId: { equals: userId } }, { isDefault: { equals: false } }],
      },
      limit: 0,
    })
    if (isAtLimit(totalDocs, limits.timerCategories)) {
      return err(
        isPlanUnlimited(plan, 'timerCategories')
          ? SAFETY_CAP_ERRORS.TIMER_CATEGORIES_CAP
          : LIMIT_ERRORS.TIMER_CATEGORIES_LIMIT,
      )
    }

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
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const category = await payload.findByID({ collection: 'timer-categories', id })
    if ((category as any).userId !== userId) return err('Not authorized')

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

export const getTaskSessions = async (taskId: number) => {
  const userId = await getUserId()
  if (!userId) return { totalSessions: 0, totalSeconds: 0 }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'timer-sessions',
    where: {
      and: [{ userId: { equals: userId } }, { taskId: { equals: taskId } }],
    },
    limit: 0,
  })

  return {
    totalSessions: docs.length,
    totalSeconds: docs.reduce((s, d) => s + d.duration, 0),
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

    const { plan, limits } = await getUserPlanLimits()
    const { totalDocs } = await payload.find({
      collection: 'timer-configs',
      where: { userId: { equals: userId } },
      limit: 0,
    })
    if (isAtLimit(totalDocs, limits.timerPresets)) {
      return err(
        isPlanUnlimited(plan, 'timerPresets')
          ? SAFETY_CAP_ERRORS.TIMER_PRESETS_CAP
          : LIMIT_ERRORS.TIMER_PRESETS_LIMIT,
      )
    }

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
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const timerConfig = await payload.findByID({ collection: 'timer-configs', id })
    if ((timerConfig as any).userId !== userId) return err('Not authorized')

    await payload.delete({ collection: 'timer-configs', id })
    return ok(true)
  } catch {
    return err('Error deleting config')
  }
}
