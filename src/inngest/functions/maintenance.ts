import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { pool } from '@/lib/db-pool'
import { Task } from '@/payload-types'

// One daily job instead of six separate crons (it used to be hourly, and
// before that six crons). Every run is a Vercel function invocation (one per
// Inngest step, each possibly a cold start that loads Payload) and wakes the
// Neon compute for at least 5 minutes — so it runs once a day, as a single
// step.
//
// Recurring tasks don't depend on it: each user's own tasks are re-synced for
// their local day on their first visit (syncRecurringTasksForUser in the app
// layout). This run only catches up users who haven't opened the app, so
// shared lists stay right for their other members.

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

async function getUserTimezones(): Promise<Record<string, string>> {
  const { rows } = await pool.query<{ id: string; timezone: string | null }>(
    'SELECT id, timezone FROM "user"',
  )
  return Object.fromEntries(rows.map((r) => [r.id, r.timezone || 'UTC']))
}

function weekdayInTimezone(timezone: string, now: Date): (typeof DAYS)[number] {
  try {
    const day = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' })
      .format(now)
      .toLowerCase()
      .slice(0, 3)
    return day as (typeof DAYS)[number]
  } catch {
    return DAYS[now.getUTCDay()]
  }
}

/** Activates/deactivates recurring tasks for users whose local day just started. */
async function syncRecurringTasks(userTimezones: Record<string, string>, userIds: string[]) {
  const payload = await getPayload({ config })
  const now = new Date()
  const { docs: recurringTasks } = await payload.find({
    collection: 'tasks',
    limit: 0,
    pagination: false,
    depth: 0,
    select: { userId: true, status: true, recurrence: true, subtasks: true },
    where: {
      and: [
        { type: { equals: 'recurring' } },
        { status: { not_equals: 'deleted' } },
        { userId: { in: userIds } },
      ],
    },
  })

  let updated = 0
  for (const task of recurringTasks) {
    const recurrence = task.recurrence as { frequency: 'daily' | 'custom'; days?: string[] } | null
    if (!recurrence) continue

    const today = weekdayInTimezone(userTimezones[task.userId as string] ?? 'UTC', now)
    const shouldBeActive =
      recurrence.frequency === 'daily' || (recurrence.days?.includes(today) ?? false)
    const subtasks = (task.subtasks ?? []) as NonNullable<Task['subtasks']>

    let status: 'active' | 'inactive' | null = null
    if (shouldBeActive && (task.status === 'inactive' || task.status === 'completed')) {
      status = 'active'
    } else if (!shouldBeActive && (task.status === 'active' || task.status === 'completed')) {
      status = 'inactive'
    }
    if (!status) continue

    await payload.update({
      collection: 'tasks',
      id: task.id,
      data: { status, subtasks: subtasks.map((s) => ({ ...s, done: false })) },
    })
    updated++
  }
  return { updated, total: recurringTasks.length }
}

/** Moves tasks flagged "auto delete on due date" to the trash once their due date has passed. */
async function autoDeleteExpiredTasks() {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()
  const { docs } = await payload.update({
    collection: 'tasks',
    depth: 0,
    where: {
      and: [
        { autoDeleteOnDueDate: { equals: true } },
        { status: { in: ['active', 'inactive', 'completed'] } },
        { dueDate: { less_than: now } },
      ],
    },
    data: { status: 'deleted', trashedAt: now },
  })
  return { trashed: docs.length }
}

/** Permanently deletes tasks that have been in the trash for 15 days. */
async function cleanupTrashedTasks() {
  const payload = await getPayload({ config })
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 15)
  const { docs } = await payload.delete({
    collection: 'tasks',
    depth: 0,
    where: {
      and: [
        { status: { equals: 'deleted' } },
        { trashedAt: { less_than_equal: cutoff.toISOString() } },
      ],
    },
  })
  return { deleted: docs.length }
}

/** Deletes task-completion snapshots older than 4 months. */
async function cleanTaskCompletions() {
  const payload = await getPayload({ config })
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 4)
  const { docs } = await payload.delete({
    collection: 'task-completions',
    depth: 0,
    where: { completedAt: { less_than: cutoff.toISOString() } },
  })
  return { deleted: docs.length }
}

/** Deletes habits archived more than 30 days ago, with their completions. */
async function cleanupArchivedHabits() {
  const payload = await getPayload({ config })
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const { docs: habits } = await payload.find({
    collection: 'habits',
    limit: 0,
    pagination: false,
    depth: 0,
    select: { archivedAt: true },
    where: {
      and: [
        { archivedAt: { exists: true } },
        { archivedAt: { less_than_equal: cutoff.toISOString() } },
      ],
    },
  })
  if (habits.length === 0) return { deleted: 0 }

  const habitIds = habits.map((h) => h.id)
  await payload.delete({
    collection: 'habit-completions',
    depth: 0,
    where: { habitId: { in: habitIds } },
  })
  await payload.delete({ collection: 'habits', depth: 0, where: { id: { in: habitIds } } })
  return { deleted: habitIds.length }
}

export const dailyMaintenance = inngest.createFunction(
  {
    id: 'daily-maintenance',
    name: 'Daily maintenance (recurring tasks catch-up + cleanups)',
    // 03:00 UTC: the new day has started across Europe/Africa/Asia.
    triggers: { cron: '0 3 * * *' },
  },
  async ({ step }) =>
    step.run('maintenance', async () => {
      const userTimezones = await getUserTimezones()
      return {
        recurring: await syncRecurringTasks(userTimezones, Object.keys(userTimezones)),
        expired: await autoDeleteExpiredTasks(),
        trashed: await cleanupTrashedTasks(),
        completions: await cleanTaskCompletions(),
        habits: await cleanupArchivedHabits(),
      }
    }),
)
