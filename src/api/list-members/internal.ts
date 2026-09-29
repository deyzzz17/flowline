import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { getWorkspaceRoleForUser } from '@/lib/get-current-workspace'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'

// Server-only helpers for other server code (webhooks, jobs, other actions).
// They take user/team ids as trusted input, so they must never be server
// actions: anything exported from a 'use server' file can be called from
// the browser with arbitrary arguments.

export async function countSharedLists(
  payload: Awaited<ReturnType<typeof getPayload>>,
  ownerId: string,
): Promise<number> {
  const { totalDocs } = await payload.find({
    collection: 'lists',
    where: {
      and: [
        { userId: { equals: ownerId } },
        { isShared: { equals: true } },
        { planArchivedAt: { exists: false } },
      ],
    },
    limit: 0,
  })
  return totalDocs
}

export async function restoreAllArchivedSharedListsForUserId(userId: string): Promise<void> {
  try {
    const payload = await getPayload({ config })
    const { limits } = await getPlanLimitsForUserId(userId)

    const activeCount = await countSharedLists(payload, userId)
    const room =
      limits.sharedLists === Infinity ? Infinity : Math.max(0, limits.sharedLists - activeCount)
    if (room <= 0) return

    // Same reasoning as restoreAllArchivedListsForUserId: no "current
    // workspace" in a webhook context, so each candidate is checked against
    // the workspaces this user is still actually a member of instead.
    const { docs: allArchived } = await payload.find({
      collection: 'lists',
      where: {
        and: [
          { userId: { equals: userId } },
          { isShared: { equals: true } },
          { planArchivedAt: { exists: true } },
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
    console.error('restoreAllArchivedSharedListsForUserId error:', e)
  }
}
