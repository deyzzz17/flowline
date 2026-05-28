'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flame, Check, BarChart2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type HabitAnalytics } from '@/api/habits/actions'
import { format, parseISO } from 'date-fns'

// GitHub-style heatmap
function Heatmap({ data }: { data: HabitAnalytics['heatmapData']; color?: string }) {
  if (data.length === 0) return null

  const weeks: ((typeof data)[0] | null)[][] = []
  let currentWeek: ((typeof data)[0] | null)[] = []

  if (data.length > 0) {
    const firstDate = parseISO(data[0].date)
    const firstDow = (firstDate.getDay() + 6) % 7 // Mon=0
    for (let i = 0; i < firstDow; i++) currentWeek.push(null)
  }

  for (const d of data) {
    currentWeek.push(d)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    weeks.push(currentWeek)
  }

  const getIntensity = (d: (typeof data)[0] | null) => {
    if (!d || d.total === 0) return 0
    return d.count / d.total
  }

  const getColor = (intensity: number) => {
    if (intensity === 0) return 'bg-muted/40'
    if (intensity < 0.25) return 'bg-emerald-200 dark:bg-emerald-900'
    if (intensity < 0.5) return 'bg-emerald-300 dark:bg-emerald-700'
    if (intensity < 0.75) return 'bg-emerald-400 dark:bg-emerald-600'
    return 'bg-emerald-500'
  }

  return (
    <div>
      <div className="flex gap-1 mb-1">
        <div className="w-8" />
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d} className="flex-1 text-center text-[10px] text-muted-foreground/50">
            {d}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((week, wi) => {
          const firstReal = week.find(Boolean)
          const weekLabel = firstReal ? format(parseISO((firstReal as any).date), 'MMM d') : ''
          return (
            <div key={wi} className="flex items-center gap-1">
              <div className="w-8 text-[10px] text-muted-foreground/40 text-right shrink-0">
                {wi % 2 === 0 ? weekLabel : ''}
              </div>
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day ? `${day.date}: ${day.count}/${day.total}` : undefined}
                  className={cn(
                    'flex-1 aspect-square rounded-sm transition-all',
                    getColor(getIntensity(day)),
                  )}
                />
              ))}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1">
        <span className="text-[10px] text-muted-foreground/50">Less</span>
        {[0, 0.2, 0.5, 0.8, 1].map((v, i) => (
          <div key={i} className={cn('h-3 w-3 rounded-sm', getColor(v))} />
        ))}
        <span className="text-[10px] text-muted-foreground/50">More</span>
      </div>
    </div>
  )
}

interface HabitsAnalyticsClientProps {
  initialData: HabitAnalytics
}

export function HabitsAnalyticsClient({ initialData }: HabitsAnalyticsClientProps) {
  const [data, setData] = useState(initialData)

  if (data.totalHabits === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
        <Link
          href="/habits"
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
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
      <Link
        href="/habits"
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
        <p className="mt-1 text-sm text-muted-foreground">Last 90 days</p>
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

      <div className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">Completion heatmap</p>
        <Heatmap data={data.heatmapData} />
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
                key={habit.id}
                href={`/habits/${habit.id}`}
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
