'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ok, err } from '@/types/result'
import { getSession } from '@/lib/get-session'
import { getUserPlanLimits, getPlanLimitsForUserId } from '@/lib/get-user-plan'
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
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
    },
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
      where: {
        and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
      },
      limit: 0,
    })
  }

  return existing
}

async function countActiveTimerCategories(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: string,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'timer-categories',
    where: {
      and: [
        { userId: { equals: userId } },
        { isDefault: { equals: false } },
        { planArchivedAt: { exists: false } },
      ],
    },
    limit: 0,
  })
  return totalDocs
}

export const createTimerCategory = async (data: { name: string; color: string }) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const { plan, limits } = await getUserPlanLimits()
    const totalDocs = await countActiveTimerCategories(payload, userId)
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

export const checkTimerCategoriesCompliance = async () => {
  const userId = await getUserId()
  if (!userId) return null

  const payload = await getPayload({ config })
  const { limits } = await getUserPlanLimits()

  const { docs: activeCategories, totalDocs } = await payload.find({
    collection: 'timer-categories',
    sort: 'createdAt',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { isDefault: { equals: false } },
        { planArchivedAt: { exists: false } },
      ],
    },
  })

  if (totalDocs <= limits.timerCategories) return null

  return {
    overBy: totalDocs - limits.timerCategories,
    limit: limits.timerCategories,
    categories: activeCategories,
  }
}

export const chooseTimerCategoriesToKeep = async (keepIds: number[]) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const { limits } = await getUserPlanLimits()

    if (keepIds.length > limits.timerCategories) {
      return err('TOO_MANY_SELECTED')
    }

    const { docs: activeCategories } = await payload.find({
      collection: 'timer-categories',
      where: {
        and: [
          { userId: { equals: userId } },
          { isDefault: { equals: false } },
          { planArchivedAt: { exists: false } },
        ],
      },
      limit: 0,
    })

    const keepSet = new Set(keepIds)
    const toArchive = activeCategories.filter((c) => !keepSet.has(c.id))

    const now = new Date().toISOString()
    for (const category of toArchive) {
      if ((category as any).userId !== userId) continue
      await payload.update({
        collection: 'timer-categories',
        id: category.id,
        data: { planArchivedAt: now } as any,
      })
    }

    return ok(true)
  } catch {
    return err('Error while archiving categories')
  }
}

export const restoreArchivedTimerCategory = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const category = await payload.findByID({ collection: 'timer-categories', id })
    if (!category || (category as any).userId !== userId) return err('Not authorized')
    if (!(category as any).planArchivedAt) return err('Category is not archived')

    const { limits } = await getUserPlanLimits()
    const currentCount = await countActiveTimerCategories(payload, userId)

    if (isAtLimit(currentCount, limits.timerCategories)) {
      return err('LIMIT_FULL')
    }

    await payload.update({
      collection: 'timer-categories',
      id,
      data: { planArchivedAt: null } as any,
    })

    return ok(true)
  } catch {
    return err('Error while restoring the category')
  }
}

export const listPlanArchivedTimerCategories = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  return await payload.find({
    collection: 'timer-categories',
    sort: '-planArchivedAt',
    limit: 0,
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: true } }],
    },
  })
}

export async function restoreAllArchivedTimerCategoriesForUserId(userId: string): Promise<void> {
  try {
    const payload = await getPayload({ config })
    const { limits } = await getPlanLimitsForUserId(userId)

    const activeCount = await countActiveTimerCategories(payload, userId)
    const room =
      limits.timerCategories === Infinity
        ? Infinity
        : Math.max(0, limits.timerCategories - activeCount)
    if (room <= 0) return

    const { docs: archived } = await payload.find({
      collection: 'timer-categories',
      where: {
        and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: true } }],
      },
      sort: 'planArchivedAt',
      limit: room === Infinity ? 0 : room,
    })

    for (const category of archived) {
      await payload.update({
        collection: 'timer-categories',
        id: category.id,
        data: { planArchivedAt: null } as any,
      })
    }
  } catch (e) {
    console.error('restoreAllArchivedTimerCategoriesForUserId error:', e)
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
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
    },
    sort: '-createdAt',
    limit: 50,
  })
}

async function countActiveTimerConfigs(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: string,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'timer-configs',
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
    },
    limit: 0,
  })
  return totalDocs
}

export const saveTimerConfig = async (data: Omit<SavedTimerConfig, 'id'>) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const { plan, limits } = await getUserPlanLimits()
    const totalDocs = await countActiveTimerConfigs(payload, userId)
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

export const checkTimerConfigsCompliance = async () => {
  const userId = await getUserId()
  if (!userId) return null

  const payload = await getPayload({ config })
  const { limits } = await getUserPlanLimits()

  const { docs: activeConfigs, totalDocs } = await payload.find({
    collection: 'timer-configs',
    sort: '-createdAt',
    limit: 0,
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
    },
  })

  if (totalDocs <= limits.timerPresets) return null

  return {
    overBy: totalDocs - limits.timerPresets,
    limit: limits.timerPresets,
    configs: activeConfigs,
  }
}

export const chooseTimerConfigsToKeep = async (keepIds: number[]) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const { limits } = await getUserPlanLimits()

    if (keepIds.length > limits.timerPresets) {
      return err('TOO_MANY_SELECTED')
    }

    const { docs: activeConfigs } = await payload.find({
      collection: 'timer-configs',
      where: {
        and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
      },
      limit: 0,
    })

    const keepSet = new Set(keepIds)
    const toArchive = activeConfigs.filter((c) => !keepSet.has(c.id))

    const now = new Date().toISOString()
    for (const timerConfig of toArchive) {
      if ((timerConfig as any).userId !== userId) continue
      await payload.update({
        collection: 'timer-configs',
        id: timerConfig.id,
        data: { planArchivedAt: now } as any,
      })
    }

    return ok(true)
  } catch {
    return err('Error while archiving presets')
  }
}

export const restoreArchivedTimerConfig = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const timerConfig = await payload.findByID({ collection: 'timer-configs', id })
    if (!timerConfig || (timerConfig as any).userId !== userId) return err('Not authorized')
    if (!(timerConfig as any).planArchivedAt) return err('Preset is not archived')

    const { limits } = await getUserPlanLimits()
    const currentCount = await countActiveTimerConfigs(payload, userId)

    if (isAtLimit(currentCount, limits.timerPresets)) {
      return err('LIMIT_FULL')
    }

    await payload.update({
      collection: 'timer-configs',
      id,
      data: { planArchivedAt: null } as any,
    })

    return ok(true)
  } catch {
    return err('Error while restoring the preset')
  }
}

export const listPlanArchivedTimerConfigs = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  return await payload.find({
    collection: 'timer-configs',
    sort: '-planArchivedAt',
    limit: 0,
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: true } }],
    },
  })
}

export async function restoreAllArchivedTimerConfigsForUserId(userId: string): Promise<void> {
  try {
    const payload = await getPayload({ config })
    const { limits } = await getPlanLimitsForUserId(userId)

    const activeCount = await countActiveTimerConfigs(payload, userId)
    const room =
      limits.timerPresets === Infinity ? Infinity : Math.max(0, limits.timerPresets - activeCount)
    if (room <= 0) return

    const { docs: archived } = await payload.find({
      collection: 'timer-configs',
      where: {
        and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: true } }],
      },
      sort: 'planArchivedAt',
      limit: room === Infinity ? 0 : room,
    })

    for (const timerConfig of archived) {
      await payload.update({
        collection: 'timer-configs',
        id: timerConfig.id,
        data: { planArchivedAt: null } as any,
      })
    }
  } catch (e) {
    console.error('restoreAllArchivedTimerConfigsForUserId error:', e)
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
