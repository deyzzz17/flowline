'use server'
import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ok, err } from '@/types/result'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/get-session'
import { getUserPlanLimits, getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export const listUserTags = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }
  const payload = await getPayload({ config })
  return await payload.find({
    collection: 'user-tags',
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
    },
    sort: 'createdAt',
    limit: 0,
  })
}

async function countActiveTags(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: string,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'user-tags',
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
    },
    limit: 0,
  })
  return totalDocs
}

export const createUserTag = async (data: { name: string; color: string }) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    if (!data.name.trim()) return err('Name is required')
    if (!data.color.trim()) return err('Color is required')

    const payload = await getPayload({ config })

    const { plan, limits } = await getUserPlanLimits()
    const totalDocs = await countActiveTags(payload, userId)
    if (isAtLimit(totalDocs, limits.customTags)) {
      return err(
        isPlanUnlimited(plan, 'customTags') ? SAFETY_CAP_ERRORS.TAGS_CAP : LIMIT_ERRORS.TAGS_LIMIT,
      )
    }

    const tag = await payload.create({
      collection: 'user-tags',
      data: {
        name: data.name.trim(),
        color: data.color,
        userId,
      },
    })

    revalidatePath('/')
    return ok(tag)
  } catch {
    return err('Error while creating tag')
  }
}

export const checkTagsCompliance = async () => {
  const userId = await getUserId()
  if (!userId) return null

  const payload = await getPayload({ config })
  const { limits } = await getUserPlanLimits()

  const { docs: activeTags, totalDocs } = await payload.find({
    collection: 'user-tags',
    sort: 'createdAt',
    limit: 0,
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
    },
  })

  if (totalDocs <= limits.customTags) return null

  return { overBy: totalDocs - limits.customTags, limit: limits.customTags, tags: activeTags }
}

export const chooseTagsToKeep = async (keepIds: number[]) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const { limits } = await getUserPlanLimits()

    if (keepIds.length > limits.customTags) {
      return err('TOO_MANY_SELECTED')
    }

    const { docs: activeTags } = await payload.find({
      collection: 'user-tags',
      where: {
        and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
      },
      limit: 0,
    })

    const keepSet = new Set(keepIds)
    const toArchive = activeTags.filter((t) => !keepSet.has(t.id))

    const now = new Date().toISOString()
    for (const tag of toArchive) {
      if (tag.userId !== userId) continue
      await payload.update({
        collection: 'user-tags',
        id: tag.id,
        data: { planArchivedAt: now },
      })
    }

    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while archiving tags')
  }
}

export const restoreArchivedTag = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const tag = await payload.findByID({ collection: 'user-tags', id })
    if (!tag || tag.userId !== userId) return err('Not authorized')
    if (!(tag as any).planArchivedAt) return err('Tag is not archived')

    const { limits } = await getUserPlanLimits()
    const currentCount = await countActiveTags(payload, userId)

    if (isAtLimit(currentCount, limits.customTags)) {
      return err('LIMIT_FULL')
    }

    await payload.update({
      collection: 'user-tags',
      id,
      data: { planArchivedAt: null },
    })

    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while restoring the tag')
  }
}

export async function restoreAllArchivedTagsForUserId(userId: string): Promise<void> {
  try {
    const payload = await getPayload({ config })
    const { limits } = await getPlanLimitsForUserId(userId)

    const activeCount = await countActiveTags(payload, userId)
    const room =
      limits.customTags === Infinity ? Infinity : Math.max(0, limits.customTags - activeCount)
    if (room <= 0) return

    const { docs: archived } = await payload.find({
      collection: 'user-tags',
      where: {
        and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: true } }],
      },
      sort: 'planArchivedAt',
      limit: room === Infinity ? 0 : room,
    })

    for (const tag of archived) {
      await payload.update({
        collection: 'user-tags',
        id: tag.id,
        data: { planArchivedAt: null },
      })
    }
  } catch (e) {
    console.error('restoreAllArchivedTagsForUserId error:', e)
  }
}

export const listPlanArchivedTags = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  return await payload.find({
    collection: 'user-tags',
    sort: '-planArchivedAt',
    limit: 0,
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: true } }],
    },
  })
}

export const deleteUserTag = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const payload = await getPayload({ config })
    const tag = await payload.findByID({ collection: 'user-tags', id })
    if (tag.userId !== userId) return err('Not authorized')
    await payload.delete({ collection: 'user-tags', id })
    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while deleting tag')
  }
}

export const updateUserTag = async (id: number, data: { name?: string; color?: string }) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const payload = await getPayload({ config })
    const tag = await payload.findByID({ collection: 'user-tags', id })
    if (tag.userId !== userId) return err('Not authorized')
    const updated = await payload.update({
      collection: 'user-tags',
      id,
      data: {
        ...(data.name?.trim() && { name: data.name.trim() }),
        ...(data.color && { color: data.color }),
      },
    })
    revalidatePath('/')
    return ok(updated)
  } catch {
    return err('Error while updating tag')
  }
}
