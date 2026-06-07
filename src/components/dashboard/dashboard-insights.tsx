import { Sparkles } from 'lucide-react'
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
}

function computeInsights(params: {
  habits: HabitWithStats[]
  timerToday: SessionAnalytics
  timerWeek: SessionAnalytics
  timerLastWeek: SessionAnalytics
  activeTasks: Task[]
  completedTasks: Task[]
}): Insight[] {
  const { habits, timerToday, timerWeek, timerLastWeek, activeTasks, completedTasks } = params
  const insights: Insight[] = []

  const hasAnyData = habits.length > 0 || timerWeek.totalSeconds > 0 || completedTasks.length > 0

  if (!hasAnyData) return []

  const bestStreak = habits
    .filter((h) => h.currentStreak >= 7)
    .sort((a, b) => b.currentStreak - a.currentStreak)[0]
  if (bestStreak) {
    insights.push({
      type: 'good',
      text: (
        <>
          <strong>{bestStreak.name}</strong> is on a{' '}
          <strong>{bestStreak.currentStreak}-day streak</strong> — your longest active run.
        </>
      ),
    })
  }

  const atRisk = habits
    .filter((h) => !h.completedToday && h.currentStreak >= 3)
    .sort((a, b) => b.currentStreak - a.currentStreak)[0]
  if (atRisk) {
    insights.push({
      type: 'warn',
      text: (
        <>
          <strong>{atRisk.name}</strong> has a {atRisk.currentStreak}-day streak that will break
          today if you don&apos;t complete it.
        </>
      ),
    })
  }

  const topHabit = habits
    .filter((h) => h.completionRate30d >= 80 && h.currentStreak >= 5)
    .sort((a, b) => b.completionRate30d - a.completionRate30d)[0]
  if (topHabit && topHabit.id !== bestStreak?.id) {
    insights.push({
      type: 'good',
      text: (
        <>
          <strong>{topHabit.name}</strong> is at{' '}
          <strong>{topHabit.completionRate30d}% completion</strong> over the last 30 days. Keep it
          up.
        </>
      ),
    })
  }

  const weakestHabit = habits
    .filter((h) => h.completionRate30d > 0 && h.completionRate30d < 40)
    .sort((a, b) => a.completionRate30d - b.completionRate30d)[0]
  if (weakestHabit) {
    insights.push({
      type: 'warn',
      text: (
        <>
          <strong>{weakestHabit.name}</strong> has only a{' '}
          <strong>{weakestHabit.completionRate30d}% completion rate</strong> over the last 30 days.
          It might need attention.
        </>
      ),
    })
  }

  const topCategory = timerWeek.timeByCategory[0]
  if (topCategory && timerWeek.totalSeconds > 0) {
    const pct = Math.round((topCategory.seconds / timerWeek.totalSeconds) * 100)
    insights.push({
      type: 'neutral',
      text: (
        <>
          <strong>{topCategory.name}</strong> accounts for{' '}
          <strong>{pct}% of your focus time</strong> this week ({formatSeconds(topCategory.seconds)}
          ).
        </>
      ),
    })
  }

  if (timerWeek.totalSeconds > 0 && timerLastWeek.totalSeconds > 0) {
    const diff = timerWeek.totalSeconds - timerLastWeek.totalSeconds
    const pctChange = Math.round(Math.abs(diff / timerLastWeek.totalSeconds) * 100)
    if (pctChange >= 10) {
      if (diff > 0) {
        insights.push({
          type: 'good',
          text: (
            <>
              Your focus time is up <strong>+{pctChange}%</strong> compared to last week (
              {formatSeconds(timerWeek.totalSeconds)} vs {formatSeconds(timerLastWeek.totalSeconds)}
              ).
            </>
          ),
        })
      } else {
        insights.push({
          type: 'warn',
          text: (
            <>
              Your focus time dropped <strong>−{pctChange}%</strong> compared to last week (
              {formatSeconds(timerWeek.totalSeconds)} vs {formatSeconds(timerLastWeek.totalSeconds)}
              ).
            </>
          ),
        })
      }
    }
  }

  if (timerLastWeek.timeByCategory.length > 0) {
    for (const lastWeekCat of timerLastWeek.timeByCategory) {
      const thisWeekCat = timerWeek.timeByCategory.find((c) => c.name === lastWeekCat.name)
      const thisWeekSec = thisWeekCat?.seconds ?? 0
      if (lastWeekCat.seconds > 3600 && thisWeekSec < lastWeekCat.seconds * 0.5) {
        const drop = Math.round(((lastWeekCat.seconds - thisWeekSec) / lastWeekCat.seconds) * 100)
        insights.push({
          type: 'warn',
          text: (
            <>
              Your time on <strong>{lastWeekCat.name}</strong> dropped by <strong>{drop}%</strong>{' '}
              this week compared to last week.
            </>
          ),
        })
        break
      }
    }
  }

  if (timerToday.longestSessionSeconds >= 3600) {
    insights.push({
      type: 'good',
      text: (
        <>
          You had a <strong>{formatSeconds(timerToday.longestSessionSeconds)} session</strong>{' '}
          today, that&apos;s a solid deep work block.
        </>
      ),
    })
  }

  const now = new Date()
  const overdue = activeTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now)
  if (overdue.length >= 3) {
    insights.push({
      type: 'warn',
      text: (
        <>
          You have <strong>{overdue.length} overdue tasks</strong>. Consider reviewing your
          priorities today.
        </>
      ),
    })
  } else if (overdue.length === 1) {
    insights.push({
      type: 'warn',
      text: (
        <>
          <strong>{overdue[0].title}</strong> is overdue. It might be worth tackling it first.
        </>
      ),
    })
  }

  if (completedTasks.length >= 3) {
    insights.push({
      type: 'good',
      text: (
        <>
          You&apos;ve already completed <strong>{completedTasks.length} tasks</strong> today. Solid
          momentum.
        </>
      ),
    })
  }

  const topTask = activeTasks[0]
  if (topTask && timerToday.totalSessions === 0 && timerToday.totalSeconds === 0) {
    type ListObj = { name?: string | null }
    const listName =
      topTask.list && typeof topTask.list === 'object'
        ? ((topTask.list as ListObj).name ?? null)
        : null
    insights.push({
      type: 'neutral',
      text: (
        <>
          No focus sessions logged yet today. <strong>{topTask.title}</strong>
          {listName ? ` (${listName})` : ''} is waiting.
        </>
      ),
    })
  }

  const warns = insights.filter((i) => i.type === 'warn')
  const goods = insights.filter((i) => i.type === 'good')
  const neutrals = insights.filter((i) => i.type === 'neutral')

  const ordered = [...warns.slice(0, 2), ...goods.slice(0, 2), ...neutrals.slice(0, 1)]
  return ordered.slice(0, 4)
}

interface DashboardInsightsProps {
  habits: HabitWithStats[]
  timerToday: SessionAnalytics
  timerWeek: SessionAnalytics
  timerLastWeek: SessionAnalytics
  activeTasks: Task[]
  completedTasks: Task[]
}

export function DashboardInsights({
  habits,
  timerToday,
  timerWeek,
  timerLastWeek,
  activeTasks,
  completedTasks,
}: DashboardInsightsProps) {
  const insights = computeInsights({
    habits,
    timerToday,
    timerWeek,
    timerLastWeek,
    activeTasks,
    completedTasks,
  })

  if (insights.length === 0) return null

  const dotColor = {
    good: 'bg-emerald-500',
    warn: 'bg-orange-500',
    neutral: 'bg-muted-foreground/50',
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
            <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor[insight.type]}`} />
              <p className="text-sm text-muted-foreground leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
