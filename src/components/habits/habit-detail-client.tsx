'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flame, Check, Calendar, TrendingUp, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  toggleHabitCompletion,
  markGoalComplete,
  archiveHabit,
  deleteHabit,
  getHabitDetail,
  type HabitDetail,
  type HabitGoal,
  type TrackingDataPoint,
  HabitWithStats,
} from '@/api/habits/actions'
import { HabitTrackingDialog } from './habit-tracking-dialog'
import { HabitTrackingCharts } from './habit-tracking-charts'
import { type HabitTrackingAnalyticsResult } from '@/api/habits-analytics/actions'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { format, parseISO, endOfMonth, eachDayOfInterval } from 'date-fns'
import { useRouter } from 'next/navigation'
import { AlertDialog, AlertDialogContent, AlertDialogFooter } from '@/components/ui/alert-dialog'
import { useSearchParams, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

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

function parseJsonField<T>(raw: any): T | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  return raw as T
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

function GoalCard({
  goal,
  color,
  trackingData,
  onToggleComplete,
  isPending,
}: {
  goal: HabitGoal
  color: string
  trackingData: TrackingDataPoint[]
  onToggleComplete: () => void
  isPending: boolean
}) {
  const isMilestone = goal.type === 'field' && !goal.endOnReach
  const isEndGoal = goal.type === 'field' && goal.endOnReach
  const isManual = goal.type === 'manual'

  const fieldTargets =
    goal.fieldTargets ??
    (goal.fieldKey ? [{ fieldKey: goal.fieldKey, targetValue: goal.targetValue ?? 10 }] : [])

  const fieldProgress = fieldTargets.map((target) => {
    const current = trackingData.reduce((sum, point) => {
      const v = point.values[target.fieldKey]
      return sum + (typeof v === 'number' ? v : 0)
    }, 0)
    const pct = Math.min(100, Math.round((current / target.targetValue) * 100))
    return { ...target, current, pct }
  })

  const allReached = fieldProgress.length > 0 && fieldProgress.every((f) => f.pct >= 100)

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
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}25` }}
        >
          <Trophy className="h-5 w-5" style={{ color }} />
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
      <p className="text-sm font-semibold text-foreground leading-snug">{goal.description}</p>
      {goal.type === 'field' && fieldProgress.length > 0 && (
        <div className="space-y-2 max-w-xs mx-auto w-full">
          {fieldProgress.map((fp) => (
            <div key={fp.fieldKey} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground capitalize">{fp.fieldKey}</span>
                <span className="font-semibold" style={{ color }}>
                  {fp.current} / {fp.targetValue}
                  {fp.pct > 0 && (
                    <span className="ml-1 text-muted-foreground font-normal">({fp.pct}%)</span>
                  )}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${fp.pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
          {trackingData.length === 0 && (
            <p className="text-[10px] text-muted-foreground/50">
              Track values each session to see progress
            </p>
          )}
        </div>
      )}
      {isManual && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onToggleComplete}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={{ backgroundColor: color, color: 'white', border: `1px solid ${color}` }}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            Mark as complete
          </button>
        </div>
      )}
      {goal.type === 'field' && allReached && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onToggleComplete}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={{ backgroundColor: color, color: 'white', border: `1px solid ${color}` }}
          >
            <Trophy className="h-3.5 w-3.5" />
            Claim goal!
          </button>
        </div>
      )}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10"
        style={{ backgroundColor: color }}
      />
      <div
        className="pointer-events-none absolute -bottom-3 -left-3 h-10 w-10 rounded-full opacity-10"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

function EndOnReachDialog({
  open,
  habitName,
  habitColor,
  onArchive,
  onDelete,
  isPending,
}: {
  open: boolean
  habitName: string
  habitColor: string
  onArchive: () => void
  onDelete: () => void
  isPending: boolean
}) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm">
        <div className="flex flex-col items-center text-center gap-3 mb-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${habitColor}20`, border: `1px solid ${habitColor}30` }}
          >
            <Trophy className="h-7 w-7" style={{ color: habitColor }} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">All goals reached! 🎉</h2>
            <p className="text-sm text-muted-foreground">
              You have completed all end goals for <strong>{habitName}</strong>. What would you like
              to do with this habit?
            </p>
          </div>
        </div>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onArchive}
            disabled={isPending}
            className="w-full gap-2"
            style={{ backgroundColor: habitColor, color: 'white', borderColor: habitColor }}
          >
            Archive habit
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isPending} className="w-full">
            Delete habit
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface HabitDetailClientProps {
  habit: HabitDetail
  initialTrackingAnalytics: HabitTrackingAnalyticsResult
}

export function HabitDetailClient({
  habit: initialHabit,
  initialTrackingAnalytics,
}: HabitDetailClientProps) {
  const router = useRouter()
  const [habit, setHabit] = useState(initialHabit)
  const [isPending, startTransition] = useTransition()
  const [trackingOpen, setTrackingOpen] = useState(false)

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const endOnReachDialogOpen = searchParams.get('allGoalsReached') === '1'

  const queryClient = useQueryClient()

  const openEndOnReachDialog = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('allGoalsReached', '1')
    router.replace(`${pathname}?${params.toString()}`)
  }

  const closeEndOnReachDialog = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('allGoalsReached')
    router.replace(`${pathname}?${params.toString()}`)
  }

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

  const handleToggleGoal = async (goalId: string) => {
    const goals: HabitGoal[] = parseJsonField<HabitGoal[]>((habit as any).goals) ?? []
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    const wasCompleted = !!goal.completedAt

    if (!wasCompleted) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: [habit.color, '#f97316', '#8b5cf6', '#10b981', '#f59e0b'],
      })
      setTimeout(
        () =>
          confetti({
            particleCount: 60,
            spread: 100,
            origin: { y: 0.55, x: 0.3 },
            colors: [habit.color, '#ec4899', '#6366f1'],
          }),
        200,
      )
      setTimeout(
        () =>
          confetti({
            particleCount: 60,
            spread: 100,
            origin: { y: 0.55, x: 0.7 },
            colors: [habit.color, '#0ea5e9', '#84cc16'],
          }),
        350,
      )

      const result = await markGoalComplete(habit.id, goalId, true)
      if ('error' in result) {
        toast.error('Failed to update goal')
        return
      }

      setTimeout(() => {
        const updatedGoals = goals.map((g) =>
          g.id === goalId ? { ...g, completedAt: new Date().toISOString() } : g,
        )
        setHabit((prev) => ({ ...prev, goals: updatedGoals }) as any)

        const endOnReachGoals = updatedGoals.filter((g) => g.type === 'field' && g.endOnReach)
        const allEndOnReachClaimed =
          endOnReachGoals.length > 0 && endOnReachGoals.every((g) => !!g.completedAt)
        if (allEndOnReachClaimed) {
          setTimeout(() => openEndOnReachDialog())
        }

        refresh()
      }, 1500)
    } else {
      const updatedGoals = goals.map((g) => (g.id === goalId ? { ...g, completedAt: null } : g))
      setHabit((prev) => ({ ...prev, goals: updatedGoals }) as any)

      const result = await markGoalComplete(habit.id, goalId, false)
      if ('error' in result) {
        toast.error('Failed to update goal')
        setHabit((prev) => ({ ...prev, goals }) as any)
        return
      }
      refresh()
    }
  }

  const handleArchiveHabit = () => {
    startTransition(async () => {
      const result = await archiveHabit(habit.id)
      if ('error' in result) {
        toast.error('Failed to archive habit')
        return
      }
      toast.success('Habit archived')
      closeEndOnReachDialog()
      queryClient.setQueryData(
        ['habits'],
        (old: HabitWithStats[] | undefined) => old?.filter((h) => h.id !== habit.id) ?? [],
      )
      router.push('/habits/habits-view')
    })
  }

  const handleDeleteHabit = () => {
    startTransition(async () => {
      const result = await deleteHabit(habit.id)
      if ('error' in result) {
        toast.error('Failed to delete habit')
        return
      }
      toast.success('Habit deleted')
      closeEndOnReachDialog()
      queryClient.setQueryData(
        ['habits'],
        (old: HabitWithStats[] | undefined) => old?.filter((h) => h.id !== habit.id) ?? [],
      )
      router.push('/habits/habits-view')
    })
  }

  const goals: HabitGoal[] = (() => {
    const rawGoals = parseJsonField<HabitGoal[]>((habit as any).goals)
    if (rawGoals && rawGoals.length > 0) return rawGoals
    const oldGoal = parseJsonField<HabitGoal>((habit as any).goal)
    if (oldGoal?.description) return [{ ...oldGoal, id: oldGoal.id ?? 'legacy' }]
    return []
  })()

  const activeGoals = goals.filter((g) => !g.completedAt)
  const completedGoals = goals.filter((g) => !!g.completedAt)

  const completionSet = new Set(habit.completions)
  const now = new Date()
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  }).reverse()

  const activeTrackingFields = (habit.trackingFields ?? []).filter((f) => f.enabled)
  const hasNumberFields = activeTrackingFields.some((f) => f.type === 'number')

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

      {activeGoals.length > 0 && (
        <div className="mb-6 space-y-3">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              color={habit.color}
              trackingData={habit.trackingData ?? []}
              onToggleComplete={() => handleToggleGoal(goal.id)}
              isPending={isPending}
            />
          ))}
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

      {hasNumberFields && (
        <div className="mb-6">
          <HabitTrackingCharts
            habitId={habit.id}
            color={habit.color}
            initialData={initialTrackingAnalytics}
          />
        </div>
      )}

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

      {completedGoals.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/40">
            Completed goals
          </p>
          <div className="flex flex-wrap gap-3">
            {completedGoals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => handleToggleGoal(goal.id)}
                disabled={isPending}
                title="Click to mark as incomplete"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 transition-all hover:scale-105 hover:brightness-110"
                style={{
                  width: '100px',
                  minHeight: '100px',
                  background: `linear-gradient(135deg, ${habit.color}cc 0%, ${habit.color}99 100%)`,
                }}
              >
                <Trophy
                  className="h-7 w-7"
                  style={{ color: habit.color, filter: 'brightness(2)' }}
                />
                <span className="text-[11px] font-semibold text-white text-center leading-tight line-clamp-2">
                  {goal.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <HabitTrackingDialog
        key={habit.id}
        open={trackingOpen}
        habitName={habit.name}
        habitColor={habit.color}
        fields={activeTrackingFields}
        onSubmit={handleTrackingSubmit}
        onSkip={handleTrackingSkip}
        onClose={() => setTrackingOpen(false)}
      />

      <EndOnReachDialog
        open={endOnReachDialogOpen}
        habitName={habit.name}
        habitColor={habit.color}
        onArchive={handleArchiveHabit}
        onDelete={handleDeleteHabit}
        isPending={isPending}
      />
    </div>
  )
}
