import Link from 'next/link'
import { Target, Flame, Calendar, Timer, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import type { DashboardTodayEvent } from '@/api/dashboard/actions'
import type { SessionAnalytics } from '@/api/timer-analytics/actions'
import { FocusWeeklyBars } from '@/components/dashboard/focus-weekly-bar'

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

function getDayMessage(overall: number): { label: string; color: string } {
  if (overall === 0) return { label: 'Day just started', color: 'text-muted-foreground' }
  if (overall < 25) return { label: 'Getting started', color: 'text-blue-500 dark:text-blue-400' }
  if (overall < 50)
    return { label: 'Building momentum', color: 'text-orange-500 dark:text-orange-400' }
  if (overall < 75) return { label: 'Halfway there', color: 'text-amber-500 dark:text-amber-400' }
  if (overall < 100)
    return { label: 'Almost there', color: 'text-emerald-500 dark:text-emerald-400' }
  return { label: 'Perfect day 🎉', color: 'text-emerald-500 dark:text-emerald-400' }
}

interface DashboardOverviewProps {
  activeTasks: number
  completedTasks: number
  totalTasks: number
  overdueTasks: number
  habitsCompletedToday: number
  habitsTotal: number
  habitWeekRate: number
  habitStreak: number
  focusTodaySeconds: number
  focusYesterdaySeconds: number
  timerWeek: SessionAnalytics
  todayEvents: DashboardTodayEvent[]
}

export function DashboardOverview({
  activeTasks,
  completedTasks,
  totalTasks,
  overdueTasks,
  habitsCompletedToday,
  habitsTotal,
  habitWeekRate,
  habitStreak,
  focusTodaySeconds,
  focusYesterdaySeconds,
  timerWeek,
  todayEvents,
}: DashboardOverviewProps) {
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const habitPct = habitsTotal > 0 ? Math.round((habitsCompletedToday / habitsTotal) * 100) : 0
  const focusPct = Math.min(100, Math.round((focusTodaySeconds / (4 * 3600)) * 100))
  const overall = Math.round(taskPct * 0.4 + habitPct * 0.4 + focusPct * 0.2)

  const circumference = 2 * Math.PI * 24
  const dash = circumference - (overall / 100) * circumference
  const { label: dayLabel, color: dayColor } = getDayMessage(overall)

  const focusDiff = focusTodaySeconds - focusYesterdaySeconds
  const focusDiffPct =
    focusYesterdaySeconds > 0 ? Math.round(Math.abs(focusDiff / focusYesterdaySeconds) * 100) : null

  const weeklyBars = timerWeek.timeSeries.map((point, i) => {
    const total = timerWeek.seriesDefinitions
      .filter((d) => d.type === 'category')
      .reduce((sum, def) => sum + ((point[def.key] as number) ?? 0), 0)
    return {
      label: point.label as string,
      seconds: total,
      isToday: i === timerWeek.timeSeries.length - 1,
    }
  })
  const hasWeeklyFocus = weeklyBars.some((b) => b.seconds > 0)

  const now = new Date()
  const nextEvent = todayEvents.find((e) => new Date(e.endDate) >= now) ?? null
  const calendarSub = nextEvent
    ? `Next: ${nextEvent.title} at ${formatEventTime(nextEvent.startDate)}`
    : todayEvents.length > 0
      ? 'All done for today'
      : 'Nothing on the calendar'

  return (
    <section className="mb-6">
      <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Today</h2>
            <p className={`text-xs font-medium ${dayColor}`}>{dayLabel}</p>
          </div>
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
              <circle cx="28" cy="28" r="24" fill="none" className="stroke-muted" strokeWidth="5" />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                className="text-orange-500 dark:text-orange-400 transition-all duration-700"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dash}
              />
            </svg>
            <span className="absolute text-xs font-bold text-foreground">{overall}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/lists/today"
            className="group rounded-xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-orange-500/40 hover:bg-orange-500/5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                <Target className="h-4 w-4 text-orange-500" />
              </div>
              {overdueTasks > 0 ? (
                <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">
                  {overdueTasks} overdue
                </span>
              ) : (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-colors group-hover:text-orange-500" />
              )}
            </div>
            <p className="text-xl font-bold text-foreground">{activeTasks}</p>
            <p className="mb-2 text-xs text-muted-foreground">tasks remaining</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-700"
                style={{ width: `${taskPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {completedTasks} completed today · {taskPct}%
            </p>
          </Link>

          <Link
            href="/habits/habits-view"
            className="group rounded-xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-teal-500/40 hover:bg-teal-500/5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
                <Flame className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-colors group-hover:text-teal-500" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {habitsTotal > 0 ? `${habitsCompletedToday}/${habitsTotal}` : '—'}
            </p>
            <p className="mb-2 text-xs text-muted-foreground">habits today</p>
            {habitsTotal > 0 ? (
              <>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-700"
                    style={{ width: `${habitPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {habitWeekRate}% this week
                  {habitStreak > 0 ? ` · ${habitStreak}-day streak` : ''}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground">Add a habit to track it here</p>
            )}
          </Link>

          <Link
            href="/timer"
            className="group rounded-xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-pink-500/40 hover:bg-pink-500/5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10">
                <Timer className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              {focusDiffPct !== null && focusTodaySeconds > 0 ? (
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                    focusDiff >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {focusDiff >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {focusDiffPct}%
                </span>
              ) : (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-colors group-hover:text-pink-500" />
              )}
            </div>
            <p className="text-xl font-bold text-foreground">
              {focusTodaySeconds > 0 ? formatSeconds(focusTodaySeconds) : '—'}
            </p>
            <p className="mb-2 text-xs text-muted-foreground">focus today</p>
            {hasWeeklyFocus ? (
              <FocusWeeklyBars bars={weeklyBars} />
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Start the timer to track focus
              </p>
            )}
          </Link>

          <Link
            href="/calendar"
            className="group rounded-xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-violet-500/40 hover:bg-violet-500/5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-colors group-hover:text-violet-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{todayEvents.length}</p>
            <p className="mb-2 text-xs text-muted-foreground">
              event{todayEvents.length !== 1 ? 's' : ''} today
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{calendarSub}</p>
          </Link>
        </div>
      </div>
    </section>
  )
}
