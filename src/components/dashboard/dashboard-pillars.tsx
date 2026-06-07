import { CheckCircle2, Flame, Timer, AlertTriangle } from 'lucide-react'
import type { HabitWithStats } from '@/api/habits/actions'

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
  habits,
}: DashboardPillarsProps) {
  const atRiskHabit =
    habits
      .filter((h) => !h.completedToday)
      .sort((a, b) => a.completionRate30d - b.completionRate30d)[0] ?? null

  const taskCompletionPct =
    activeTasks + completedTodayTasks > 0
      ? Math.round((completedTodayTasks / (activeTasks + completedTodayTasks)) * 100)
      : 0

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tasks
            </span>
          </div>
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{activeTasks}</p>
              <p className="text-xs text-muted-foreground">remaining</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-red-500 dark:text-red-400">
                {overdueTasks}
              </p>
              <p className="text-xs text-muted-foreground">overdue</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {completedTodayTasks}
              </p>
              <p className="text-xs text-muted-foreground">done today</p>
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Completion</span>
              <span>{taskCompletionPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
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
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                All habits done today
              </p>
            </div>
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
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {focusTodaySeconds > 0 ? formatSeconds(focusTodaySeconds) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">today</p>
            </div>
            {focusWeekSeconds > 0 && (
              <div>
                <p className="text-xl font-bold tracking-tight text-pink-600 dark:text-pink-400">
                  {formatSeconds(focusWeekSeconds)}
                </p>
                <p className="text-xs text-muted-foreground">this week</p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Daily goal (4h)</span>
                <span>{Math.min(100, Math.round((focusTodaySeconds / (4 * 3600)) * 100))}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round((focusTodaySeconds / (4 * 3600)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
