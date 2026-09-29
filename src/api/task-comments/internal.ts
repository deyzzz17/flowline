import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'

// Server-only helpers for other server code (webhooks, jobs, other actions).
// They take user/team ids as trusted input, so they must never be server
// actions: anything exported from a 'use server' file can be called from
// the browser with arbitrary arguments.

export async function deleteCommentsForTaskIds(taskIds: number[]): Promise<void> {
  if (taskIds.length === 0) return
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'task-comments',
      where: { task: { in: taskIds } },
      limit: 0,
    })
    for (const comment of docs) {
      await payload.delete({ collection: 'task-comments', id: comment.id })
    }
  } catch (e) {
    console.error('deleteCommentsForTaskIds error:', e)
  }
}
