'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flame, Check, BarChart2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type HabitAnalytics } from '@/api/habits/actions'
import { type TrophyAnalyticsResult } from '@/api/habits-analytics/goal-trophy-analytics-actions'
import { TrophyAnalyticsChart } from './trophy-analytics-chart'
import { parseISO } from 'date-fns'

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const DAY_LABELS = ['Mon', 'Wed', 'Fri']
const DAY_LABEL_ROWS = [1, 3, 5]

interface TooltipState {
  visible: boolean
  x: number
  y: number
  text: string
}

function Heatmap({ data }: { data: HabitAnalytics['heatmapData'] }) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, text: '' })

  if (data.length === 0) return null

  type Cell = { date: string; count: number; total: number } | null
  const columns: Cell[][] = []
  let currentCol: Cell[] = []

  if (data.length > 0) {
    const firstDate = parseISO(data[0].date)
    const firstDow = (firstDate.getDay() + 6) % 7
    for (let i = 0; i < firstDow; i++) currentCol.push(null)
  }

  for (const d of data) {
    currentCol.push(d)
    if (currentCol.length === 7) {
      columns.push(currentCol)
      currentCol = []
    }
  }
  if (currentCol.length > 0) {
    while (currentCol.length < 7) currentCol.push(null)
    columns.push(currentCol)
  }

  const monthPositions: { label: string; colIndex: number }[] = []
  let lastMonth = -1
  columns.forEach((col, ci) => {
    const firstReal = col.find(Boolean)
    if (!firstReal) return
    const m = parseISO((firstReal as any).date).getMonth()
    if (m !== lastMonth) {
      monthPositions.push({ label: MONTH_LABELS[m], colIndex: ci })
      lastMonth = m
    }
  })

  const getIntensity = (cell: Cell) => {
    if (!cell || cell.total === 0) return 0
    return cell.count / cell.total
  }

  const getCellClass = (intensity: number) => {
    if (intensity === 0) return 'bg-muted/50 dark:bg-muted/30'
    if (intensity <= 0.25) return 'bg-violet-200 dark:bg-violet-900/70'
    if (intensity <= 0.5) return 'bg-violet-300 dark:bg-violet-700'
    if (intensity <= 0.75) return 'bg-violet-400 dark:bg-violet-500'
    return 'bg-violet-500 dark:bg-violet-400'
  }

  const containerDivRef = { current: null as HTMLDivElement | null }

  const handleMouseEnter = (e: React.MouseEvent, cell: Cell) => {
    if (!cell || !containerDivRef.current) return
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const containerRect = containerDivRef.current.getBoundingClientRect()
    const text =
      cell.total === 0
        ? `${cell.date}: no target`
        : `${cell.date}: ${cell.count}/${cell.total} completed`
    setTooltip({
      visible: true,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 6,
      text,
    })
  }

  const CELL = 11
  const GAP = 2

  return (
    <div
      ref={(n) => {
        containerDivRef.current = n
      }}
      className="relative select-none"
    >
      {tooltip.visible && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background shadow-md whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
        </div>
      )}
      <div className="flex mb-1 pl-7">
        {columns.map((_, ci) => {
          const mp = monthPositions.find((m) => m.colIndex === ci)
          return (
            <div
              key={ci}
              style={{ width: CELL + GAP, flexShrink: 0 }}
              className="text-[10px] text-muted-foreground/50 overflow-hidden"
            >
              {mp ? mp.label : ''}
            </div>
          )
        })}
      </div>
      <div className="flex gap-0">
        <div className="flex flex-col mr-1" style={{ gap: GAP, width: 24 }}>
          {Array.from({ length: 7 }, (_, row) => (
            <div
              key={row}
              style={{ height: CELL }}
              className="flex items-center justify-end text-[9px] text-muted-foreground/40 pr-1"
            >
              {DAY_LABEL_ROWS.includes(row) ? DAY_LABELS[DAY_LABEL_ROWS.indexOf(row)] : ''}
            </div>
          ))}
        </div>
        <div className="flex" style={{ gap: GAP }}>
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col" style={{ gap: GAP }}>
              {col.map((cell, ri) => (
                <div
                  key={ri}
                  style={{ width: CELL, height: CELL }}
                  className={cn(
                    'rounded-[2px] transition-all cursor-default',
                    cell ? getCellClass(getIntensity(cell)) : 'bg-transparent',
                  )}
                  onMouseEnter={cell ? (e) => handleMouseEnter(e, cell) : undefined}
                  onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1">
        <span className="text-[10px] text-muted-foreground/50">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div
            key={i}
            style={{ width: CELL, height: CELL }}
            className={cn('rounded-[2px]', getCellClass(v))}
          />
        ))}
        <span className="text-[10px] text-muted-foreground/50">More</span>
      </div>
    </div>
  )
}

interface HabitsAnalyticsClientProps {
  initialData: HabitAnalytics
  initialTrophyData: TrophyAnalyticsResult
}

export function HabitsAnalyticsClient({
  initialData,
  initialTrophyData,
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

      <div className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-5 overflow-x-auto">
        <p className="mb-4 text-sm font-semibold text-foreground">Completion heatmap</p>
        <Heatmap data={data.heatmapData} />
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
