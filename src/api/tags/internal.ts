import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'

// Server-only helpers for other server code (webhooks, jobs, other actions).
// They take user/team ids as trusted input, so they must never be server
// actions: anything exported from a 'use server' file can be called from
// the browser with arbitrary arguments.

export async function countActiveTags(
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
