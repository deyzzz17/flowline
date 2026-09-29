import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { getWorkspaceRoleForUser } from '@/lib/get-current-workspace'

// Server-only helpers for other server code (webhooks, jobs, other actions).
// They take user/team ids as trusted input, so they must never be server
// actions: anything exported from a 'use server' file can be called from
// the browser with arbitrary arguments.

export async function countActiveLists(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: string,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'lists',
    where: {
      and: [
        { userId: { equals: userId } },
        { planArchivedAt: { exists: false } },
        { isShared: { not_equals: true } },
      ],
    },
    limit: 0,
  })
  return totalDocs
}

export async function restoreAllArchivedListsForUserId(userId: string): Promise<void> {
  try {
    const payload = await getPayload({ config })
    const { limits } = await getPlanLimitsForUserId(userId)

    const activeCount = await countActiveLists(payload, userId)
    const room = limits.lists === Infinity ? Infinity : Math.max(0, limits.lists - activeCount)
    if (room <= 0) return

    // No single "current workspace" here — this runs from a plan-upgrade
    // webhook, not a page request — so instead of scoping to one workspace,
    // every candidate is checked against the workspaces this user is still
    // actually a member of. Otherwise a list archived while on a workspace
    // the user has since left (or that got deleted) would silently come
    // back on upgrade, counting against their quota with no way to reach it.
    const { docs: allArchived } = await payload.find({
      collection: 'lists',
      where: {
        and: [
          { userId: { equals: userId } },
          { planArchivedAt: { exists: true } },
          { isShared: { not_equals: true } },
        ],
      },
      sort: 'planArchivedAt',
      limit: 0,
    })

    const restorable: typeof allArchived = []
    for (const list of allArchived) {
      if (room !== Infinity && restorable.length >= room) break
      if (!list.workspace) {
        restorable.push(list)
        continue
      }
      const role = await getWorkspaceRoleForUser(list.workspace, userId)
      if (role) restorable.push(list)
    }
    const archived = restorable

    for (const list of archived) {
      await payload.update({
        collection: 'lists',
        id: list.id,
        data: { planArchivedAt: null },
      })

      const { docs: tasks } = await payload.find({
        collection: 'tasks',
        where: { list: { equals: list.id } },
        limit: 0,
      })
      for (const task of tasks) {
        await payload.update({
          collection: 'tasks',
          id: task.id,
          data: { planArchivedAt: null } as any,
        })
      }
    }
  } catch (e) {
    console.error('restoreAllArchivedListsForUserId error:', e)
  }
}
