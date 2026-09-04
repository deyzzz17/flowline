import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import type { HabitWithStats } from '@/api/habits/actions'
import type { SessionAnalytics } from '@/api/timer-analytics/actions'
import type { Task } from '@/payload-types'

function formatSeconds(s: number): string {
  if (s === 0) return '0m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

export interface Insight {
  type: 'good' | 'warn' | 'neutral'
  text: React.ReactNode
  href?: string
  linkLabel?: string
}

function computeInsights(params: {
  habits: HabitWithStats[]
  timerToday: SessionAnalytics
  timerWeek: SessionAnalytics
  timerLastWeek: SessionAnalytics
  timerYesterday: SessionAnalytics
  activeTasks: Task[]
  completedTasks: Task[]
  completedTodayCount: number
  priorityTask: Task | null
}): Insight[] {
  const {
    habits,
    timerToday,
    timerWeek,
    timerLastWeek,
    timerYesterday,
    activeTasks,
    completedTasks,
    completedTodayCount,
    priorityTask,
  } = params
  const insights: Insight[] = []

  const hasAnyData = habits.length > 0 || timerWeek.totalSeconds > 0 || completedTasks.length > 0
  if (!hasAnyData) return []

  const now = new Date()

  const streakAtRisk = habits
    .filter((h) => !h.completedToday && h.currentStreak >= 3)
    .sort((a, b) => b.currentStreak - a.currentStreak)[0]
  if (streakAtRisk) {
    insights.push({
      type: 'warn',
      text: (
        <>
          <strong>{streakAtRisk.name}</strong> will lose its{' '}
          <strong>{streakAtRisk.currentStreak}-day streak</strong> today if you don&apos;t complete
          it.
        </>
      ),
      href: '/habits/habits-view',
      linkLabel: 'Complete it',
    })
  }

  const newRecord = habits
    .filter(
      (h) => h.currentStreak > 0 && h.currentStreak === h.longestStreak && h.currentStreak >= 10,
    )
    .sort((a, b) => b.currentStreak - a.currentStreak)[0]
  if (newRecord) {
    insights.push({
      type: 'good',
      text: (
        <>
          <strong>{newRecord.name}</strong> is at a{' '}
          <strong>personal record of {newRecord.currentStreak} days</strong>. Keep going.
        </>
      ),
      href: '/habits/habits-view',
      linkLabel: 'View habit',
    })
  }

  const topHabit = habits
    .filter((h) => h.completionRate30d >= 85 && h.id !== newRecord?.id)
    .sort((a, b) => b.completionRate30d - a.completionRate30d)[0]
  if (topHabit) {
    insights.push({
      type: 'good',
      text: (
        <>
          <strong>{topHabit.name}</strong> — <strong>{topHabit.completionRate30d}%</strong>{' '}
          completion over 30 days. That&apos;s a strong routine.
        </>
      ),
      href: '/habits/habits-view',
      linkLabel: 'View habit',
    })
  }

  const weakHabit = habits
    .filter((h) => h.completionRate30d > 0 && h.completionRate30d < 35)
    .sort((a, b) => a.completionRate30d - b.completionRate30d)[0]
  if (weakHabit) {
    insights.push({
      type: 'warn',
      text: (
        <>
          <strong>{weakHabit.name}</strong> has a{' '}
          <strong>{weakHabit.completionRate30d}% completion rate</strong> over 30 days — it might
          need a smaller, more achievable target.
        </>
      ),
      href: '/habits/habits-view',
      linkLabel: 'View habit',
    })
  }

  if (timerToday.totalSeconds > 0 && timerYesterday.totalSeconds > 0) {
    const diff = timerToday.totalSeconds - timerYesterday.totalSeconds
    const pct = Math.round(Math.abs(diff / timerYesterday.totalSeconds) * 100)
    if (pct >= 15) {
      if (diff > 0) {
        insights.push({
          type: 'good',
          text: (
            <>
              You&apos;ve already logged <strong>{formatSeconds(timerToday.totalSeconds)}</strong>{' '}
              of focus today — <strong>+{pct}% more</strong> than yesterday.
            </>
          ),
          href: '/timer-analytics',
          linkLabel: 'View stats',
        })
      } else {
        insights.push({
          type: 'neutral',
          text: (
            <>
              Focus today ({formatSeconds(timerToday.totalSeconds)}) is{' '}
              <strong>{pct}% below yesterday</strong> ({formatSeconds(timerYesterday.totalSeconds)}
              ). Still time to catch up.
            </>
          ),
          href: '/timer',
          linkLabel: 'Start focusing',
        })
      }
    }
  }

  if (timerWeek.totalSeconds > 0 && timerLastWeek.totalSeconds > 0) {
    const diff = timerWeek.totalSeconds - timerLastWeek.totalSeconds
    const pct = Math.round(Math.abs(diff / timerLastWeek.totalSeconds) * 100)
    if (pct >= 15) {
      if (diff > 0) {
        insights.push({
          type: 'good',
          text: (
            <>
              Focus this week (<strong>{formatSeconds(timerWeek.totalSeconds)}</strong>) is up{' '}
              <strong>+{pct}%</strong> vs last week ({formatSeconds(timerLastWeek.totalSeconds)}).
            </>
          ),
          href: '/timer-analytics',
          linkLabel: 'View stats',
        })
      } else {
        insights.push({
          type: 'warn',
          text: (
            <>
              Focus this week ({formatSeconds(timerWeek.totalSeconds)}) is down{' '}
              <strong>−{pct}%</strong> vs last week ({formatSeconds(timerLastWeek.totalSeconds)}).
            </>
          ),
          href: '/timer-analytics',
          linkLabel: 'View stats',
        })
      }
    }
  }

  if (timerToday.longestSessionSeconds >= 3600) {
    insights.push({
      type: 'good',
      text: (
        <>
          Your longest session today was{' '}
          <strong>{formatSeconds(timerToday.longestSessionSeconds)}</strong> — a solid deep work
          block.
        </>
      ),
      href: '/timer-analytics',
      linkLabel: 'View stats',
    })
  }

  const topCat = timerWeek.timeByCategory[0]
  if (topCat && timerWeek.totalSeconds > 0) {
    const pct = Math.round((topCat.seconds / timerWeek.totalSeconds) * 100)
    if (pct >= 50) {
      insights.push({
        type: 'neutral',
        text: (
          <>
            <strong>{topCat.name}</strong> takes up <strong>{pct}%</strong> of your focus time this
            week ({formatSeconds(topCat.seconds)}). Is that intentional?
          </>
        ),
        href: '/timer-analytics',
        linkLabel: 'View stats',
      })
    }
  }

  if (timerLastWeek.timeByCategory.length > 0) {
    for (const last of timerLastWeek.timeByCategory) {
      const curr = timerWeek.timeByCategory.find((c) => c.name === last.name)
      const currSec = curr?.seconds ?? 0
      if (last.seconds > 3600 && currSec < last.seconds * 0.4) {
        const drop = Math.round(((last.seconds - currSec) / last.seconds) * 100)
        insights.push({
          type: 'warn',
          text: (
            <>
              Time on <strong>{last.name}</strong> is down <strong>−{drop}%</strong> this week vs
              last ({formatSeconds(last.seconds)} → {formatSeconds(currSec)}).
            </>
          ),
          href: '/timer-analytics',
          linkLabel: 'View stats',
        })
        break
      }
    }
  }

  if (timerToday.totalSeconds === 0 && priorityTask) {
    type ListObj = { name?: string | null }
    const listName =
      priorityTask.list && typeof priorityTask.list === 'object'
        ? ((priorityTask.list as ListObj).name ?? null)
        : null
    insights.push({
      type: 'neutral',
      text: (
        <>
          No focus sessions today yet. <strong>{priorityTask.title}</strong>
          {listName ? <> ({listName})</> : null} is your next task.
        </>
      ),
      href: '/timer',
      linkLabel: 'Start focusing',
    })
  }

  const overdue = activeTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now)
  if (overdue.length >= 3) {
    insights.push({
      type: 'warn',
      text: (
        <>
          <strong>{overdue.length} tasks are overdue.</strong> Consider reviewing your priorities
          before adding new ones.
        </>
      ),
      href: '/lists/today',
      linkLabel: 'Review',
    })
  } else if (overdue.length === 1) {
    insights.push({
      type: 'warn',
      text: (
        <>
          <strong>{overdue[0].title}</strong> is overdue. It might be worth tackling it first.
        </>
      ),
      href: '/lists/today',
      linkLabel: 'Review',
    })
  }

  if (completedTodayCount >= 3) {
    insights.push({
      type: 'good',
      text: (
        <>
          <strong>{completedTodayCount} tasks</strong> completed today. You&apos;re on a
          productive streak.
        </>
      ),
      href: '/lists/today',
      linkLabel: 'View tasks',
    })
  }

  const warns = insights.filter((i) => i.type === 'warn').slice(0, 2)
  const goods = insights.filter((i) => i.type === 'good').slice(0, 2)
  const neutrals = insights.filter((i) => i.type === 'neutral').slice(0, 1)

  return [...warns, ...goods, ...neutrals].slice(0, 4)
}

interface DashboardInsightsProps {
  habits: HabitWithStats[]
  timerToday: SessionAnalytics
  timerWeek: SessionAnalytics
  timerLastWeek: SessionAnalytics
  timerYesterday: SessionAnalytics
  activeTasks: Task[]
  completedTasks: Task[]
  completedTodayCount: number
  priorityTask: Task | null
}

export function DashboardInsights({
  habits,
  timerToday,
  timerWeek,
  timerLastWeek,
  timerYesterday,
  activeTasks,
  completedTasks,
  completedTodayCount,
  priorityTask,
}: DashboardInsightsProps) {
  const insights = computeInsights({
    habits,
    timerToday,
    timerWeek,
    timerLastWeek,
    timerYesterday,
    activeTasks,
    completedTasks,
    completedTodayCount,
    priorityTask,
  })

  if (insights.length === 0) return null

  const dotColor = {
    good: 'bg-emerald-500',
    warn: 'bg-orange-500',
    neutral: 'bg-blue-400',
  }

  return (
    <section className="mb-6">
      <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">What Flowline noticed</h2>
          </div>
          <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="divide-y divide-border/40">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`mt-1.5 h-2 w-2 shrink-0 self-start rounded-full ${dotColor[insight.type]}`} />
              <p className="flex-1 text-sm text-muted-foreground leading-relaxed">{insight.text}</p>
              {insight.href && (
                <Link
                  href={insight.href}
                  className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  {insight.linkLabel ?? 'View'}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
