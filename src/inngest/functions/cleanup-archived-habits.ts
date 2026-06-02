import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const cleanupArchivedHabits = inngest.createFunction(
  {
    id: 'cleanup-archived-habits',
    name: 'Cleanup archived habits after 30 days',
    triggers: { cron: '0 3 * * *' },
  },
  async ({ step }) => {
    const deletedIds = await step.run('delete-old-archived-habits', async () => {
      const payload = await getPayload({ config })

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { docs: habits } = await payload.find({
        collection: 'habits',
        where: {
          and: [
            { archivedAt: { exists: true } },
            { archivedAt: { less_than_equal: thirtyDaysAgo.toISOString() } },
          ],
        },
        limit: 0,
      })

      const deleted: number[] = []

      for (const habit of habits) {
        try {
          const { docs: completions } = await payload.find({
            collection: 'habit-completions',
            where: { habitId: { equals: habit.id } },
            limit: 0,
          })

          for (const c of completions) {
            await payload.delete({ collection: 'habit-completions', id: c.id })
          }

          await payload.delete({ collection: 'habits', id: habit.id })
          deleted.push(habit.id)
        } catch (e) {
          console.error(`Failed to delete archived habit ${habit.id}:`, e)
        }
      }

      return deleted
    })

    return {
      deletedCount: deletedIds.length,
      deletedIds,
    }
  },
)
