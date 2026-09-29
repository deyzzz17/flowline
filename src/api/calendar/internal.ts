import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'

// Server-only helpers for other server code (webhooks, jobs, other actions).
// They take user/team ids as trusted input, so they must never be server
// actions: anything exported from a 'use server' file can be called from
// the browser with arbitrary arguments.

export async function countActiveCalendarCategories(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: string,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'calendar-categories',
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
    },
    limit: 0,
  })
  return totalDocs
}

export async function restoreAllArchivedCalendarCategoriesForUserId(userId: string): Promise<void> {
  try {
    const payload = await getPayload({ config })
    const { limits } = await getPlanLimitsForUserId(userId)

    const activeCount = await countActiveCalendarCategories(payload, userId)
    const room =
      limits.calendarCategories === Infinity
        ? Infinity
        : Math.max(0, limits.calendarCategories - activeCount)
    if (room <= 0) return

    const { docs: archived } = await payload.find({
      collection: 'calendar-categories',
      where: {
        and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: true } }],
      },
      sort: 'planArchivedAt',
      limit: room === Infinity ? 0 : room,
    })

    for (const category of archived) {
      await payload.update({
        collection: 'calendar-categories',
        id: category.id,
        data: { planArchivedAt: null } as any,
      })
    }
  } catch (e) {
    console.error('restoreAllArchivedCalendarCategoriesForUserId error:', e)
  }
}
