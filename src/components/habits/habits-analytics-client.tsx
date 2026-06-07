'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flame, Check, BarChart2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type HabitAnalytics } from '@/api/habits/actions'
import { type TrophyAnalyticsResult } from '@/api/habits-analytics/goal-trophy-analytics-actions'
import { type HeatmapAnalyticsResult } from '@/api/habits-analytics/actions'
import { TrophyAnalyticsChart } from './trophy-analytics-chart'
import { YearHeatmap } from './year-heatmap'

interface HabitsAnalyticsClientProps {
  initialData: HabitAnalytics
  initialTrophyData: TrophyAnalyticsResult
  initialHeatmapData: HeatmapAnalyticsResult
}

export function HabitsAnalyticsClient({
  initialData,
  initialTrophyData,
  initialHeatmapData,
}: HabitsAnalyticsClientProps) {
  const [data] = useState(initialData)

  if (data.totalHabits === 0) {
    return (
      <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        <Link
          href="/habits/habits-view"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All habits
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-base font-semibold text-foreground">No data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start tracking habits to see analytics here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <Link
        href="/habits/habits-view"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All habits
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="h-4 w-4 text-violet-500" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
            Analytics
          </p>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Habit insights</h1>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Active habits',
            value: String(data.totalHabits),
            icon: Flame,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
          },
          {
            label: 'Avg completion',
            value: `${data.avgCompletionRate}%`,
            icon: Check,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Today',
            value: `${data.todayCompleted}/${data.todayTotal}`,
            icon: Check,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Best streak',
            value: data.bestStreak ? String(data.bestStreak.streak) : '—',
            icon: TrendingUp,
            color: 'text-violet-500',
            bg: 'bg-violet-500/10',
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <div
              className={cn('mb-2 flex h-7 w-7 items-center justify-center rounded-lg', stat.bg)}
            >
              <stat.icon className={cn('h-3.5 w-3.5', stat.color)} />
            </div>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {data.bestStreak && (
        <p className="mb-6 text-xs text-muted-foreground/60 text-center">
          Best streak: <strong className="text-foreground">{data.bestStreak.habitName}</strong> —{' '}
          {data.bestStreak.streak} days
        </p>
      )}

      <div className="mb-6 overflow-x-auto">
        <YearHeatmap initialData={initialHeatmapData} />
      </div>

      <div className="mb-6">
        <TrophyAnalyticsChart initialData={initialTrophyData} initialPeriod="month" />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4">
          <p className="text-sm font-semibold text-foreground">Per habit</p>
        </div>
        <div className="divide-y divide-border/30">
          {data.perHabit
            .sort((a, b) => b.completionRate30d - a.completionRate30d)
            .map((habit) => (
              <Link
                key={habit.slug}
                href={`/habits/${habit.slug}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: habit.color }}
                />
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {habit.name}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {habit.currentStreak}
                  </span>
                </div>
                <div className="w-16 shrink-0">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${habit.completionRate30d}%`, backgroundColor: habit.color }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right text-xs text-muted-foreground shrink-0">
                  {habit.completionRate30d}%
                </span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}
