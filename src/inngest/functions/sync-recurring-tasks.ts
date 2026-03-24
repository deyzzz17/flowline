import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export const syncRecurringTasks = inngest.createFunction(
  { id: 'sync-recurring-tasks', name: 'Sync Recurring Tasks', triggers: { cron: '0 0 * * *' } },
  async ({ step }) => {
    await step.run('update-recurring-tasks', async () => {
      const payload = await getPayload({ config })

      const { docs: recurringTasks } = await payload.find({
        collection: 'tasks',
        limit: 0,
        where: {
          and: [{ type: { equals: 'recurring' } }, { status: { not_equals: 'deleted' } }],
        },
      })

      if (recurringTasks.length === 0) return { updated: 0 }

      const todayIndex = new Date().getDay()
      const today = DAYS[todayIndex]

      let updated = 0

      for (const task of recurringTasks) {
        const recurrence = task.recurrence as {
          frequency: 'daily' | 'custom'
          days?: string[]
        } | null

        if (!recurrence) continue

        let shouldBeActive = false

        if (recurrence.frequency === 'daily') {
          shouldBeActive = true
        } else if (recurrence.frequency === 'custom') {
          shouldBeActive = recurrence.days?.includes(today) ?? false
        }

        const newStatus = shouldBeActive ? 'active' : 'inactive'

        if (task.status !== 'completed' && task.status !== newStatus) {
          await payload.update({
            collection: 'tasks',
            id: task.id,
            data: { status: newStatus },
          })
          updated++
        }
      }

      return { updated, total: recurringTasks.length }
    })
  },
)
