'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flame, Check, Calendar, Target, TrendingUp, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  toggleHabitCompletion,
  getHabitDetail,
  type HabitDetail,
  type HabitGoal,
  type TrackingField,
  type TrackingDataPoint,
} from '@/api/habits/actions'
import { HabitTrackingDialog } from './habit-tracking-dialog'
import { toast } from 'sonner'
import { format, parseISO, endOfMonth, eachDayOfInterval } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

const DAY_LABELS: Record<string, string> = {
  mon: 'Mo',
  tue: 'Tu',
  wed: 'We',
  thu: 'Th',
  fri: 'Fr',
  sat: 'Sa',
  sun: 'Su',
}

function frequencyLabel(habit: HabitDetail): string {
  if (habit.frequency === 'daily') return 'Every day'
  if (habit.frequency === 'times_per_week') return `${habit.timesPerWeek}× per week`
  if (habit.frequency === 'days_of_week' && habit.daysOfWeek?.length)
    return habit.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ')
  return ''
}

function MonthCalendar({
  year,
  month,
  completions,
  color,
}: {
  year: number
  month: number
  completions: Set<string>
  color: string
}) {
  const firstDay = new Date(year, month, 1)
  const lastDay = endOfMonth(firstDay)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })
  const startDow = (firstDay.getDay() + 6) % 7

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        {format(firstDay, 'MMMM yyyy')}
      </p>
      <div className="grid grid-cols-7 gap-0.5">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div
            key={d}
            className="flex h-6 items-center justify-center text-[10px] text-muted-foreground/50 font-medium"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const done = completions.has(key)
          const isToday = key === format(new Date(), 'yyyy-MM-dd')
          return (
            <div
              key={key}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium mx-auto transition-all',
                done ? 'text-white' : 'text-muted-foreground/60',
              )}
              style={{
                backgroundColor: done ? color : undefined,
                outline: isToday && !done ? `1.5px solid ${color}` : undefined,
                outlineOffset: isToday && !done ? '1px' : undefined,
              }}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GoalSection({ goal, color }: { goal: HabitGoal; color: string }) {
  if (!goal.description) return null

  const isMilestone = goal.type === 'field' && !goal.endOnReach
  const isEndGoal = goal.type === 'field' && goal.endOnReach
  const isManual = goal.type === 'manual'

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-center space-y-4"
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, ${color}08 50%, ${color}14 100%)`,
        border: `1px solid ${color}30`,
      }}
    >
      <div className="flex justify-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
        >
          <Trophy className="h-6 w-6" style={{ color }} />
        </div>
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {isManual ? 'Goal' : isMilestone ? 'Milestone' : 'End goal'}
        </span>
        {isEndGoal && (
          <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
            Ends on reach
          </span>
        )}
      </div>

      <p className="text-base font-bold text-foreground leading-snug">{goal.description}</p>

      {goal.type === 'field' && goal.targetValue && (
        <div className="space-y-1.5 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold" style={{ color }}>
              — / {goal.targetValue}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: '0%', backgroundColor: color }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            Track values each session to see progress
          </p>
        </div>
      )}

      {isManual && (
        <p className="text-xs text-muted-foreground/70">
          Mark this goal as complete manually when you&pos;re ready.
        </p>
      )}

      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10"
        style={{ backgroundColor: color }}
      />
      <div
        className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full opacity-10"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

const DEFAULT_CHART_FIELDS = ['reps', 'duration', 'mood', 'energy', 'difficulty']

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold text-foreground">
        {payload[0].value} {unit}
      </p>
    </div>
  )
}

function TrackingChart({
  field,
  data,
  color,
}: {
  field: TrackingField
  data: TrackingDataPoint[]
  color: string
}) {
  const points = data
    .filter((d) => d.values[field.key] !== undefined && d.values[field.key] !== '')
    .map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      value: field.type === 'number' ? Number(d.values[field.key]) : undefined,
      rawDate: d.date,
    }))
    .filter((p) => p.value !== undefined)

  if (points.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border/40">
        <p className="text-xs text-muted-foreground/50">No data yet for {field.label}</p>
      </div>
    )
  }

  const isScale = ['mood', 'energy', 'difficulty'].includes(field.key)
  const unit = field.key === 'duration' ? 'min' : ''

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">{field.label}</p>
        {points.length > 0 && (
          <span className="text-[11px] text-muted-foreground">
            avg {Math.round(points.reduce((s, p) => s + (p.value ?? 0), 0) / points.length)}
            {unit}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={80}>
        {isScale ? (
          <BarChart data={points} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.4 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.4 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Bar dataKey="value" fill={color} opacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.4 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.4 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 3 }}
              activeDot={{ r: 5, fill: color }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

function TrackingChartsSection({ habit }: { habit: HabitDetail }) {
  const activeFields = (habit.trackingFields ?? []).filter(
    (f) => f.enabled && f.type === 'number' && DEFAULT_CHART_FIELDS.includes(f.key),
  )

  const customNumberFields = (habit.trackingFields ?? []).filter(
    (f) => f.enabled && f.type === 'number' && !DEFAULT_CHART_FIELDS.includes(f.key),
  )

  const chartsFields = [...activeFields, ...customNumberFields]

  if (chartsFields.length === 0) return null
  if (!habit.trackingData || habit.trackingData.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
        <p className="text-sm font-semibold text-foreground">Tracking charts</p>
      </div>
      <div
        className={cn(
          'grid gap-6',
          chartsFields.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2',
        )}
      >
        {chartsFields.map((field) => (
          <TrackingChart
            key={field.key}
            field={field}
            data={habit.trackingData ?? []}
            color={habit.color}
          />
        ))}
      </div>
    </div>
  )
}

interface HabitDetailClientProps {
  habit: HabitDetail
}

export function HabitDetailClient({ habit: initialHabit }: HabitDetailClientProps) {
  const [habit, setHabit] = useState(initialHabit)
  const [isPending, startTransition] = useTransition()
  const [trackingOpen, setTrackingOpen] = useState(false)

  const refresh = () => {
    startTransition(async () => {
      const fresh = await getHabitDetail(habit.id)
      if (fresh) setHabit(fresh)
    })
  }

  const handleToggle = async () => {
    if (habit.completedToday) {
      setHabit((prev) => ({
        ...prev,
        completedToday: false,
        currentStreak: Math.max(0, prev.currentStreak - 1),
      }))
      await toggleHabitCompletion(habit.id)
      refresh()
      return
    }
    const activeFields = (habit.trackingFields ?? []).filter((f) => f.enabled)
    if (activeFields.length > 0) {
      setTrackingOpen(true)
      return
    }
    setHabit((prev) => ({ ...prev, completedToday: true, currentStreak: prev.currentStreak + 1 }))
    const result = await toggleHabitCompletion(habit.id)
    if ('error' in result) {
      toast.error('Failed to update')
      refresh()
    } else {
      refresh()
    }
  }

  const handleTrackingSubmit = async (values: Record<string, number | string | boolean>) => {
    setTrackingOpen(false)
    setHabit((prev) => ({ ...prev, completedToday: true, currentStreak: prev.currentStreak + 1 }))
    const result = await toggleHabitCompletion(habit.id, undefined, values)
    if ('error' in result) toast.error('Failed to update')
    refresh()
  }

  const handleTrackingSkip = async () => {
    setTrackingOpen(false)
    setHabit((prev) => ({ ...prev, completedToday: true, currentStreak: prev.currentStreak + 1 }))
    await toggleHabitCompletion(habit.id)
    refresh()
  }

  const completionSet = new Set(habit.completions)
  const now = new Date()
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  }).reverse()

  const activeTrackingFields = (habit.trackingFields ?? []).filter((f) => f.enabled)

  return (
    <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <Link
        href="/habits/habits-view"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All habits
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
            {habit.categoryTag && (
              <span className="text-xs text-muted-foreground">{habit.categoryTag}</span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{habit.name}</h1>
          {habit.description && (
            <p className="mt-1 text-sm text-muted-foreground">{habit.description}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground/60">{frequencyLabel(habit)}</p>
          {activeTrackingFields.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground/50">
              Tracks: {activeTrackingFields.map((f) => f.label).join(', ')}
            </p>
          )}
        </div>
        <Button
          onClick={handleToggle}
          disabled={isPending}
          className="gap-2 shrink-0"
          style={
            habit.completedToday
              ? {
                  backgroundColor: `${habit.color}22`,
                  color: habit.color,
                  border: `1px solid ${habit.color}`,
                }
              : { backgroundColor: habit.color, color: 'white', border: `1px solid ${habit.color}` }
          }
        >
          <Check className="h-4 w-4" strokeWidth={3} />
          {habit.completedToday ? 'Done today' : 'Mark done'}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          {
            label: 'Current streak',
            value: habit.currentStreak,
            suffix: habit.currentStreak === 1 ? 'day' : 'days',
            icon: Flame,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
          },
          {
            label: 'Longest streak',
            value: habit.longestStreak,
            suffix: habit.longestStreak === 1 ? 'day' : 'days',
            icon: TrendingUp,
            color: 'text-violet-500',
            bg: 'bg-violet-500/10',
          },
          {
            label: '30d completion',
            value: habit.completionRate30d,
            suffix: '%',
            icon: Check,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/60 bg-card/40 p-4 text-center"
          >
            <div
              className={cn(
                'mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl',
                stat.bg,
              )}
            >
              <stat.icon className={cn('h-4 w-4', stat.color)} />
            </div>
            <div className="text-xl font-bold text-foreground">
              {stat.value}
              <span className="text-sm font-normal text-muted-foreground ml-1">{stat.suffix}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {habit.goal && (
        <div className="mb-6">
          <GoalSection goal={habit.goal} color={habit.color} />
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">Weekly progress</p>
        <div className="space-y-2">
          {habit.weeklyCompletions.slice(-8).map((week) => {
            const pct = week.target > 0 ? Math.min(100, (week.count / week.target) * 100) : 0
            return (
              <div key={week.week} className="flex items-center gap-3">
                <span className="w-16 text-right text-[11px] text-muted-foreground shrink-0">
                  {format(parseISO(week.week), 'MMM d')}
                </span>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: habit.color }}
                  />
                </div>
                <span className="w-10 text-[11px] text-muted-foreground shrink-0">
                  {week.count}/{week.target}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mb-6">
        <TrackingChartsSection habit={habit} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground/60" />
          <p className="text-sm font-semibold text-foreground">Completion history</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {months.map(({ year, month }) => (
            <MonthCalendar
              key={`${year}-${month}`}
              year={year}
              month={month}
              completions={completionSet}
              color={habit.color}
            />
          ))}
        </div>
      </div>

      <HabitTrackingDialog
        open={trackingOpen}
        habitName={habit.name}
        habitColor={habit.color}
        fields={activeTrackingFields}
        onSubmit={handleTrackingSubmit}
        onSkip={handleTrackingSkip}
        onClose={() => setTrackingOpen(false)}
      />
    </div>
  )
}
