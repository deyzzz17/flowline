import { inngest } from '@/lib/inngest'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Pool } from 'pg'

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function getTodayKeyInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-CA').format(new Date())
  }
}

function getDayNameInTimezone(timezone: string): (typeof DAYS)[number] {
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

function isHabitScheduledToday(
  habit: {
    frequency: string
    daysOfWeek?: string[] | null
    timesPerWeek?: number | null
    startDate?: string | null
    repeatEveryDays?: number | null
  },
  todayDayName: (typeof DAYS)[number],
  todayKey: string,
): boolean {
  if (habit.startDate) {
    const start = habit.startDate.slice(0, 10)
    if (start > todayKey) return false
  }

  if (habit.frequency === 'daily') return true

  if (habit.frequency === 'days_of_week') {
    return (habit.daysOfWeek ?? []).includes(todayDayName)
  }

  if (habit.frequency === 'times_per_week') {
    return true
  }

  if (habit.frequency === 'every_x_days') {
    const interval = habit.repeatEveryDays ?? 2
    const anchorStr = habit.startDate ? habit.startDate.slice(0, 10) : todayKey
    const anchor = new Date(anchorStr + 'T12:00:00Z')
    const today = new Date(todayKey + 'T12:00:00Z')
    const diffDays = Math.round((today.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays % interval === 0
  }

  return true
}

export const syncHabits = inngest.createFunction(
  {
    id: 'sync-habits',
    name: 'Sync Habits — Reset completions at midnight',
    triggers: { cron: '0 * * * *' },
  },
  async ({ step }) => {
    await step.run('reset-habit-completions', async () => {
      const payload = await getPayload({ config })

      const { docs: habits } = await payload.find({
        collection: 'habits',
        limit: 0,
        where: { archivedAt: { exists: false } },
      })

      if (habits.length === 0) return { processed: 0 }

      const userIds = [...new Set(habits.map((h) => (h as any).userId as string))]
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

      const midnightUsers = new Set<string>()
      for (const userId of userIds) {
        const tz = userTimezones[userId] ?? 'UTC'
        if (isMidnightInTimezone(tz)) {
          midnightUsers.add(userId)
        }
      }

      if (midnightUsers.size === 0) return { processed: 0, reason: 'No user at midnight' }

      let skipped = 0

      for (const habit of habits) {
        const userId = (habit as any).userId as string
        if (!midnightUsers.has(userId)) {
          skipped++
          continue
        }

        const timezone = userTimezones[userId] ?? 'UTC'
        const todayKey = getTodayKeyInTimezone(timezone)
        const todayDayName = getDayNameInTimezone(timezone)

        const scheduledToday = isHabitScheduledToday(
          {
            frequency: (habit as any).frequency,
            daysOfWeek: (habit as any).daysOfWeek,
            timesPerWeek: (habit as any).timesPerWeek,
            startDate: (habit as any).startDate,
            repeatEveryDays: (habit as any).repeatEveryDays,
          },
          todayDayName,
          todayKey,
        )

        if (!scheduledToday) {
          skipped++
          continue
        }

        const yesterdayDate = new Date(todayKey + 'T12:00:00Z')
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)
        const yesterdayKey = yesterdayDate.toISOString().slice(0, 10)

        skipped++
      }

      const { revalidatePath } = await import('next/cache')
      revalidatePath('/habits', 'page')
      revalidatePath('/habits/habits-view', 'page')
      revalidatePath('/dashboard', 'page')

      return {
        midnightUsers: midnightUsers.size,
        totalHabits: habits.length,
        revalidated: true,
      }
    })
  },
)
