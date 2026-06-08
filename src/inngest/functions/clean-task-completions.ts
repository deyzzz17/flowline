import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const cleanTaskCompletions = inngest.createFunction(
  {
    id: 'clean-task-completions',
    name: 'Clean — Delete task-completions older than 4 months',
    triggers: { cron: '0 3 * * *' },
  },
  async ({ step }) => {
    await step.run('delete-old-completions', async () => {
      const payload = await getPayload({ config })

      const cutoff = new Date()
      cutoff.setMonth(cutoff.getMonth() - 4)

      const { docs } = await payload.find({
        collection: 'task-completions',
        limit: 0,
        where: {
          completedAt: { less_than: cutoff.toISOString() },
        },
      })

      for (const doc of docs) {
        await payload.delete({ collection: 'task-completions', id: doc.id })
      }

      return { deleted: docs.length, cutoff: cutoff.toISOString() }
    })
  },
)
