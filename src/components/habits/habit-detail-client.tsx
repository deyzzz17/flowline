'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flame, Check, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toggleHabitCompletion, getHabitDetail, type HabitDetail } from '@/api/habits/actions'
import { toast } from 'sonner'
import { format, parseISO, endOfMonth, eachDayOfInterval } from 'date-fns'

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
                // outline remplace ring (ringColor n'est pas une propriété CSS valide)
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

interface HabitDetailClientProps {
  habit: HabitDetail
}

export function HabitDetailClient({ habit: initialHabit }: HabitDetailClientProps) {
  const [habit, setHabit] = useState(initialHabit)
  const [isPending, startTransition] = useTransition()

  const refresh = () => {
    startTransition(async () => {
      const fresh = await getHabitDetail(habit.id)
      if (fresh) setHabit(fresh)
    })
  }

  const handleToggle = async () => {
    setHabit((prev) => ({
      ...prev,
      completedToday: !prev.completedToday,
      currentStreak: !prev.completedToday
        ? prev.currentStreak + 1
        : Math.max(0, prev.currentStreak - 1),
    }))
    const result = await toggleHabitCompletion(habit.id)
    if ('error' in result) {
      toast.error('Failed to update')
      refresh()
    } else {
      refresh()
    }
  }

  const completionSet = new Set(habit.completions)
  const now = new Date()

  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  }).reverse()

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
      <Link
        href="/habits"
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

      <div className="mb-8 grid grid-cols-3 gap-3">
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
            icon: Flame,
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

      <div className="mb-8 rounded-2xl border border-border/60 bg-card/40 p-5">
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
    </div>
  )
}
