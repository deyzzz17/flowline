import Link from 'next/link'
import {
  Play,
  AlertTriangle,
  Flame,
  CalendarClock,
  CheckCircle2,
  ListChecks,
  Target,
  Timer as TimerIcon,
} from 'lucide-react'
import type { Task } from '@/payload-types'
import type { HabitWithStats } from '@/api/habits/actions'
import type { DashboardTodayEvent } from '@/api/dashboard/actions'

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

interface DashboardFocusNowProps {
  priorityTask: Task | null
  overdueCount: number
  overdueReviewHref: string
  atRiskHabit: HabitWithStats | null
  nextEvent: DashboardTodayEvent | null
  isNewAccount: boolean
}

export function DashboardFocusNow({
  priorityTask,
  overdueCount,
  overdueReviewHref,
  atRiskHabit,
  nextEvent,
  isNewAccount,
}: DashboardFocusNowProps) {
  type ListObj = { name?: string | null }
  const listName =
    priorityTask?.list && typeof priorityTask.list === 'object'
      ? ((priorityTask.list as ListObj).name ?? 'No project')
      : 'No project'

  const eventIsSoon =
    !!nextEvent &&
    new Date(nextEvent.startDate).getTime() - Date.now() < 3 * 60 * 60 * 1000 &&
    !nextEvent.allDay
  const hasAnything = !!priorityTask || overdueCount > 0 || !!atRiskHabit || eventIsSoon

  if (isNewAccount) {
    return (
      <section className="mb-6">
        <div className="rounded-2xl border border-border/60 bg-linear-to-br from-violet-500/10 via-card/40 to-card/40 p-6 backdrop-blur-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Welcome to Flowline
          </p>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Let&apos;s set up your first day
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/lists/today"
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 transition-colors hover:border-orange-500/40 hover:bg-orange-500/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                <ListChecks className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Add a task</p>
                <p className="text-xs text-muted-foreground">Start with today&apos;s to-dos</p>
              </div>
            </Link>
            <Link
              href="/habits/habits-view"
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 transition-colors hover:border-teal-500/40 hover:bg-teal-500/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                <Flame className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Track a habit</p>
                <p className="text-xs text-muted-foreground">Build a routine that sticks</p>
              </div>
            </Link>
            <Link
              href="/timer"
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 transition-colors hover:border-pink-500/40 hover:bg-pink-500/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-500/10">
                <TimerIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Start focusing</p>
                <p className="text-xs text-muted-foreground">Track your first session</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
        <div className="px-5 pt-5">
          <h2 className="text-sm font-semibold text-foreground">What needs you next</h2>
        </div>
        <div className="divide-y divide-border/40 px-5 pb-1">
          {overdueCount > 0 && (
            <div className="flex items-center gap-3 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {overdueCount} task{overdueCount !== 1 ? 's' : ''} overdue
                </p>
                <p className="text-xs text-muted-foreground">Worth reviewing before adding more</p>
              </div>
              <Link
                href={overdueReviewHref}
                className="shrink-0 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Review
              </Link>
            </div>
          )}

          {priorityTask && (
            <div className="flex items-center gap-3 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                <Target className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {priorityTask.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Top priority · {listName}
                </p>
              </div>
              <Link
                href="/timer"
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
              >
                <Play className="h-3 w-3 fill-white" />
                Focus
              </Link>
            </div>
          )}

          {atRiskHabit && (
            <div className="flex items-center gap-3 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {atRiskHabit.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {atRiskHabit.currentStreak > 0
                    ? `${atRiskHabit.currentStreak}-day streak — not done today`
                    : 'Not done today'}
                </p>
              </div>
              <Link
                href="/habits/habits-view"
                className="shrink-0 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                View
              </Link>
            </div>
          )}

          {eventIsSoon && nextEvent && (
            <div className="flex items-center gap-3 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <CalendarClock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{nextEvent.title}</p>
                <p className="text-xs text-muted-foreground">
                  Starts at {formatEventTime(nextEvent.startDate)}
                </p>
              </div>
              <Link
                href="/calendar?view=day"
                className="shrink-0 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                View
              </Link>
            </div>
          )}

          {!hasAnything && (
            <div className="flex items-center gap-3 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
                <p className="text-xs text-muted-foreground">
                  Nothing urgent right now. Nice work.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
