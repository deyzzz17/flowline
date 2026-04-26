import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const autoDeleteExpiredTasks = inngest.createFunction(
  {
    id: 'auto-delete-expired-tasks',
    name: 'Auto Delete Expired Tasks',
    triggers: { cron: '0 * * * *' },
  },
  async ({ step }) => {
    await step.run('soft-delete-overdue-tasks', async () => {
      const payload = await getPayload({ config })

      const now = new Date().toISOString()

      const { docs: overdueTasks } = await payload.find({
        collection: 'tasks',
        limit: 0,
        where: {
          and: [
            { autoDeleteOnDueDate: { equals: true } },
            { status: { in: ['active', 'inactive', 'completed'] } },
            { dueDate: { less_than: now } },
          ],
        },
      })

      if (overdueTasks.length === 0) return { deleted: 0 }

      let deleted = 0
      for (const task of overdueTasks) {
        await payload.update({
          collection: 'tasks',
          id: task.id,
          data: {
            status: 'deleted',
            trashedAt: now,
          },
        })
        deleted++
      }

      return { deleted, total: overdueTasks.length }
    })
  },
)
