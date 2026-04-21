import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const cleanupTrashedTasks = inngest.createFunction(
  {
    id: 'cleanup-trashed-tasks',
    name: 'Cleanup Trashed Tasks',
    triggers: { cron: '0 * * * *' },
  },
  async ({ step }) => {
    await step.run('delete-expired-trashed-tasks', async () => {
      const payload = await getPayload({ config })

      const fifteenDaysAgo = new Date()
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

      const { docs: expiredTasks } = await payload.find({
        collection: 'tasks',
        limit: 0,
        where: {
          and: [
            { status: { equals: 'deleted' } },
            { trashedAt: { less_than_equal: fifteenDaysAgo.toISOString() } },
          ],
        },
      })

      if (expiredTasks.length === 0) return { deleted: 0 }

      let deleted = 0
      for (const task of expiredTasks) {
        await payload.delete({ collection: 'tasks', id: task.id })
        deleted++
      }

      return { deleted, total: expiredTasks.length }
    })
  },
)
