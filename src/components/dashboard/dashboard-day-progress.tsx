import { Target, Flame, Calendar, Timer } from 'lucide-react'
import type { DashboardTodayEvent } from '@/api/dashboard/actions'

function formatSeconds(s: number): string {
  if (s === 0) return '0m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

interface DashboardDayProgressProps {
  activeTasks: number
  completedTasks: number
  totalTasks: number
  habitsCompletedToday: number
  habitsTotal: number
  focusTodaySeconds: number
  todayEvents: DashboardTodayEvent[]
}

export function DashboardDayProgress({
  activeTasks,
  completedTasks,
  totalTasks,
  habitsCompletedToday,
  habitsTotal,
  focusTodaySeconds,
  todayEvents,
}: DashboardDayProgressProps) {
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const habitPct = habitsTotal > 0 ? Math.round((habitsCompletedToday / habitsTotal) * 100) : 0
  const focusPct = Math.min(100, Math.round((focusTodaySeconds / (4 * 3600)) * 100))
  const overall = Math.round((taskPct + habitPct + focusPct) / 3)

  const circumference = 2 * Math.PI * 50
  const dash = circumference - (overall / 100) * circumference

  const now = new Date()
  const nextEvent = todayEvents.find((e) => new Date(e.endDate) >= now) ?? null

  const calendarLabel =
    todayEvents.length > 0
      ? `${todayEvents.length} event${todayEvents.length !== 1 ? 's' : ''} today`
      : 'No events today'

  const calendarSub = nextEvent
    ? `Next: ${nextEvent.title} at ${formatEventTime(nextEvent.startDate)}`
    : todayEvents.length > 0
      ? 'All done for today'
      : 'Calendar is clear'

  const items = [
    {
      icon: Target,
      color: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-500/10',
      label: `${activeTasks} priority task${activeTasks !== 1 ? 's' : ''} remaining`,
      sub: `${completedTasks} completed today`,
    },
    {
      icon: Flame,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-500/10',
      label: `${habitsCompletedToday}/${habitsTotal} habits done`,
      sub: `${habitsTotal - habitsCompletedToday} remaining`,
    },
    {
      icon: Calendar,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10',
      label: calendarLabel,
      sub: calendarSub,
    },
    {
      icon: Timer,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      label:
        focusTodaySeconds > 0
          ? `${formatSeconds(focusTodaySeconds)} of focus`
          : 'No focus session yet',
      sub: focusTodaySeconds > 0 ? 'logged today' : 'Start your first session',
    },
  ]

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Today at a glance</h2>
            <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
              In progress
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.bg}`}
                >
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Day progress
          </p>
          <div className="relative flex items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" className="stroke-muted" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="currentColor"
                className="text-orange-500 dark:text-orange-400 transition-all duration-700"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dash}
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-2xl font-bold text-foreground">{overall}%</p>
              <p className="text-[10px] text-muted-foreground">of the day</p>
            </div>
          </div>
          <div className="w-full space-y-1.5">
            {[
              { label: 'Tasks', pct: taskPct, color: 'bg-orange-500' },
              { label: 'Habits', pct: habitPct, color: 'bg-teal-500' },
              { label: 'Focus', pct: focusPct, color: 'bg-blue-500' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className="w-10 text-[11px] text-muted-foreground">{row.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.color} transition-all duration-700`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] text-muted-foreground">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
