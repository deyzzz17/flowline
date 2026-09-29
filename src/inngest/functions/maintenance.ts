import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { unstable_cache } from 'next/cache'
import { pool } from '@/lib/db-pool'
import { cacheTags } from '@/lib/server-cache'
import { Task } from '@/payload-types'

// One hourly job instead of six separate crons. Neon only scales to zero
// after 5 idle minutes, so every cron run that touches the DB keeps it awake
// (and billed) for at least that long — the old setup woke it 24x/day even
// with zero users, mostly to find nothing to do.
//
// Now an hourly run only touches the DB when there is real work:
// - recurring tasks flip at each user's local midnight → only in hours where
//   at least one user's timezone is at midnight (decided from a cached list
//   of timezones, so the check itself doesn't wake the DB);
// - cleanups piggyback on those runs (the DB is awake anyway), plus one
//   guaranteed daily run at 03:00 UTC.

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const DAILY_RUN_UTC_HOUR = 3

/** userId → timezone, cached a day; Better Auth's user hooks invalidate it on signup/timezone change (see auth.ts). */
const getUserTimezones = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const { rows } = await pool.query<{ id: string; timezone: string | null }>(
      'SELECT id, timezone FROM "user"',
    )
    return Object.fromEntries(rows.map((r) => [r.id, r.timezone || 'UTC']))
  },
  ['user-timezones'],
  { tags: [cacheTags.userTimezones], revalidate: 24 * 60 * 60 },
)

function hourInTimezone(timezone: string, now: Date): number {
  try {
    const hour = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(now)
    return parseInt(hour) % 24
  } catch {
    return now.getUTCHours()
  }
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

export const hourlyMaintenance = inngest.createFunction(
  {
    id: 'hourly-maintenance',
    name: 'Hourly maintenance (recurring tasks at local midnight + cleanups)',
    triggers: { cron: '0 * * * *' },
  },
  async ({ step }) => {
    const plan = await step.run('plan', async () => {
      const now = new Date()
      const userTimezones = await getUserTimezones()
      const midnightUserIds = Object.entries(userTimezones)
        .filter(([, tz]) => hourInTimezone(tz, now) === 0)
        .map(([id]) => id)
      return {
        userTimezones,
        midnightUserIds,
        isDailyRun: now.getUTCHours() === DAILY_RUN_UTC_HOUR,
      }
    })

    // Nothing due this hour → the DB is never touched (the timezone list
    // above came from the cache).
    if (plan.midnightUserIds.length === 0 && !plan.isDailyRun) {
      return { skipped: true }
    }

    const recurring =
      plan.midnightUserIds.length > 0
        ? await step.run('sync-recurring-tasks', () =>
            syncRecurringTasks(plan.userTimezones, plan.midnightUserIds),
          )
        : null
    const expired = await step.run('auto-delete-expired-tasks', autoDeleteExpiredTasks)
    const trashed = await step.run('cleanup-trashed-tasks', cleanupTrashedTasks)

    if (!plan.isDailyRun) return { recurring, expired, trashed }

    const completions = await step.run('clean-task-completions', cleanTaskCompletions)
    const habits = await step.run('cleanup-archived-habits', cleanupArchivedHabits)
    return { recurring, expired, trashed, completions, habits }
  },
)
