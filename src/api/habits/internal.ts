import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'

// Server-only helpers for other server code (webhooks, jobs, other actions).
// They take user/team ids as trusted input, so they must never be server
// actions: anything exported from a 'use server' file can be called from
// the browser with arbitrary arguments.

export async function countActiveHabits(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: string,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'habits',
    where: {
      and: [
        { userId: { equals: userId } },
        { archivedAt: { exists: false } },
        { planArchivedAt: { exists: false } },
      ],
    },
    limit: 0,
  })
  return totalDocs
}

export async function restoreAllArchivedHabitsForUserId(userId: string): Promise<void> {
  try {
    const payload = await getPayload({ config })
    const { limits } = await getPlanLimitsForUserId(userId)

    const activeCount = await countActiveHabits(payload, userId)
    const room = limits.habits === Infinity ? Infinity : Math.max(0, limits.habits - activeCount)
    if (room <= 0) return

    const { docs: archived } = await payload.find({
      collection: 'habits',
      where: {
        and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: true } }],
      },
      sort: 'planArchivedAt',
      limit: room === Infinity ? 0 : room,
    })

    for (const habit of archived) {
      await payload.update({
        collection: 'habits',
        id: habit.id,
        data: { planArchivedAt: null } as any,
      })
    }
  } catch (e) {
    console.error('restoreAllArchivedHabitsForUserId error:', e)
  }
}
