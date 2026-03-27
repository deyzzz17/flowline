import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Pool } from 'pg'
import { Task } from '@/payload-types'

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function getTodayInTimezone(timezone: string): (typeof DAYS)[number] {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    })
    const day = formatter.format(new Date()).toLowerCase().slice(0, 3)
    return day as (typeof DAYS)[number]
  } catch {
    return DAYS[new Date().getDay()]
  }
}

function isMidnightInTimezone(timezone: string): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    })
    const hour = parseInt(formatter.format(new Date()))
    return hour === 0
  } catch {
    return false
  }
}

export const syncRecurringTasks = inngest.createFunction(
  {
    id: 'sync-recurring-tasks',
    name: 'Sync Recurring Tasks',
    triggers: { cron: '0 * * * *' },
  },
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

      const userIds = [...new Set(recurringTasks.map((t) => t.userId as string))]
      const userTimezones: Record<string, string> = {}

      const pool = new Pool({ connectionString: process.env.DATABASE_URL })
      try {
        const { rows } = await pool.query('SELECT id, timezone FROM "user" WHERE id = ANY($1)', [
          userIds,
        ])
        rows.forEach((row: { id: string; timezone: string | null }) => {
          userTimezones[row.id] = row.timezone ?? 'UTC'
        })
      } finally {
        await pool.end()
      }

      let updated = 0

      for (const task of recurringTasks) {
        const userId = task.userId as string
        const timezone = userTimezones[userId] ?? 'UTC'

        if (!isMidnightInTimezone(timezone)) continue

        const recurrence = task.recurrence as {
          frequency: 'daily' | 'custom'
          days?: string[]
        } | null

        if (!recurrence) continue

        const todayForUser = getTodayInTimezone(timezone)
        const shouldBeActive =
          recurrence.frequency === 'daily' || (recurrence.days?.includes(todayForUser) ?? false)

        const subtasks = (task.subtasks ?? []) as NonNullable<Task['subtasks']>

        if (shouldBeActive && (task.status === 'inactive' || task.status === 'completed')) {
          await payload.update({
            collection: 'tasks',
            id: task.id,
            data: {
              status: 'active',
              subtasks: subtasks.map((s) => ({ ...s, done: false })),
            },
          })
          updated++
        } else if (!shouldBeActive && (task.status === 'active' || task.status === 'completed')) {
          await payload.update({
            collection: 'tasks',
            id: task.id,
            data: {
              status: 'inactive',
              subtasks: subtasks.map((s) => ({ ...s, done: false })),
            },
          })
          updated++
        }
      }

      return { updated, total: recurringTasks.length }
    })
  },
)
