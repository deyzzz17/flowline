import { CheckCircle2, Flame, Timer, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import type { HabitWithStats } from '@/api/habits/actions'
import type { SessionAnalytics } from '@/api/timer-analytics/actions'

function formatSeconds(s: number): string {
  if (s === 0) return '0m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

interface DashboardPillarsProps {
  activeTasks: number
  overdueTasks: number
  completedTodayTasks: number
  habitWeekRate: number
  habitStreak: number
  focusTodaySeconds: number
  focusWeekSeconds: number
  focusYesterdaySeconds: number
  timerWeek: SessionAnalytics
  habits: HabitWithStats[]
}

export function DashboardPillars({
  activeTasks,
  overdueTasks,
  completedTodayTasks,
  habitWeekRate,
  habitStreak,
  focusTodaySeconds,
  focusWeekSeconds,
  focusYesterdaySeconds,
  timerWeek,
  habits,
}: DashboardPillarsProps) {
  const atRiskHabit =
    habits
      .filter((h) => !h.completedToday)
      .sort((a, b) => a.completionRate30d - b.completionRate30d)[0] ?? null

  const totalTodayTasks = activeTasks + completedTodayTasks
  const taskCompletionPct =
    totalTodayTasks > 0 ? Math.round((completedTodayTasks / totalTodayTasks) * 100) : 0

  const focusDiff = focusTodaySeconds - focusYesterdaySeconds
  const focusDiffPct =
    focusYesterdaySeconds > 0 ? Math.round(Math.abs(focusDiff / focusYesterdaySeconds) * 100) : null

  const weeklyBars = timerWeek.timeSeries.map((point) => {
    const total = timerWeek.seriesDefinitions
      .filter((d) => d.type === 'category')
      .reduce((sum, def) => sum + ((point[def.key] as number) ?? 0), 0)
    return { label: point.label as string, seconds: total }
  })
  const maxBarSeconds = Math.max(...weeklyBars.map((b) => b.seconds), 1)

  const topCategoryToday = timerWeek.timeByCategory[0]

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tasks today
            </span>
          </div>
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{activeTasks}</p>
              <p className="text-xs text-muted-foreground">remaining</p>
            </div>
            {overdueTasks > 0 && (
              <div>
                <p className="text-xl font-bold tracking-tight text-red-500 dark:text-red-400">
                  {overdueTasks}
                </p>
                <p className="text-xs text-muted-foreground">overdue</p>
              </div>
            )}
            <div>
              <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {completedTodayTasks}
              </p>
              <p className="text-xs text-muted-foreground">done</p>
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Completion</span>
              <span>{taskCompletionPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                style={{ width: `${taskCompletionPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
              <Flame className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Habits
            </span>
          </div>
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{habitWeekRate}%</p>
              <p className="text-xs text-muted-foreground">weekly rate</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-orange-500 dark:text-orange-400">
                {habitStreak}
              </p>
              <p className="text-xs text-muted-foreground">day streak</p>
            </div>
          </div>
          {atRiskHabit ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">At risk</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 truncate">
                  {atRiskHabit.name}
                </p>
              </div>
            </div>
          ) : habits.length > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                All habits done today
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No habits set up yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10">
              <Timer className="h-4 w-4 text-pink-600 dark:text-pink-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Focus
            </span>
          </div>

          <div className="flex items-end gap-3 mb-3">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {focusTodaySeconds > 0 ? formatSeconds(focusTodaySeconds) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">today</p>
            </div>
            {focusDiffPct !== null && focusTodaySeconds > 0 && (
              <div className="pb-0.5 flex items-center gap-1">
                {focusDiff >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                )}
                <p
                  className={`text-sm font-semibold ${focusDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}
                >
                  {focusDiff >= 0 ? '+' : '−'}
                  {focusDiffPct}%
                </p>
                <p className="text-xs text-muted-foreground">vs yesterday</p>
              </div>
            )}
          </div>

          {weeklyBars.length > 0 && focusWeekSeconds > 0 && (
            <div className="mb-3">
              <div className="flex items-end gap-0.5 h-10">
                {weeklyBars.map((bar, i) => {
                  const heightPct = maxBarSeconds > 0 ? (bar.seconds / maxBarSeconds) * 100 : 0
                  const isToday = i === weeklyBars.length - 1
                  return (
                    <div
                      key={bar.label}
                      className="flex flex-1 flex-col items-center gap-0.5"
                      title={`${bar.label}: ${formatSeconds(bar.seconds)}`}
                    >
                      <div className="w-full flex flex-col justify-end" style={{ height: 36 }}>
                        <div
                          className={`w-full rounded-sm transition-all duration-500 ${
                            isToday
                              ? 'bg-pink-500 dark:bg-pink-400'
                              : bar.seconds > 0
                                ? 'bg-pink-200 dark:bg-pink-900'
                                : 'bg-muted'
                          }`}
                          style={{ height: `${Math.max(heightPct, bar.seconds > 0 ? 8 : 3)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground/60 leading-none">
                        {typeof bar.label === 'string' ? bar.label.slice(0, 1) : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {topCategoryToday && focusTodaySeconds > 0 ? (
            <p className="text-xs text-muted-foreground truncate">
              Mostly on <span className="font-medium text-foreground">{topCategoryToday.name}</span>{' '}
              ({formatSeconds(topCategoryToday.seconds)})
            </p>
          ) : focusTodaySeconds === 0 ? (
            <p className="text-xs text-muted-foreground">
              No sessions yet. Start the timer to track focus.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
