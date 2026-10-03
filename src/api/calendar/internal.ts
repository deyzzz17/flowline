import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { after } from 'next/server'
import { pool } from '@/lib/db-pool'
import { getWorkspaceNicknames } from '@/lib/get-current-workspace'
import { sendEventCanceledEmail } from '@/lib/notification-emails'

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

/** Emails everyone on a meeting that's being deleted (called before the delete). */
export async function notifyMeetingCanceled(
  event: { id: number; title: string; startDate: string; endDate: string; workspace?: string | null },
  actorId: string,
) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'calendar-event-invitations',
    where: { and: [{ event: { equals: event.id } }, { status: { not_equals: 'declined' } }] },
    limit: 0,
    depth: 0,
  })
  const ids = docs.map((d) => d.userId).filter((id) => id !== actorId)
  if (ids.length === 0) return
  after(async () => {
    const [nicknames, rows] = await Promise.all([
      event.workspace ? getWorkspaceNicknames(event.workspace) : Promise.resolve(new Map<string, string>()),
      pool
        .query<{ id: string; name: string; email: string; timezone: string | null }>(
          `SELECT id, name, email, timezone FROM "user" WHERE id = ANY($1)`,
          [[actorId, ...ids]],
        )
        .then((r) => r.rows),
    ])
    const actor = rows.find((r) => r.id === actorId)
    const actorName = nicknames.get(actorId) ?? actor?.name ?? null
    for (const row of rows) {
      if (row.id === actorId) continue
      await sendEventCanceledEmail(row.email, {
        title: event.title,
        organizerName: actorName,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        timezone: row.timezone || 'UTC',
      })
    }
  })
}
