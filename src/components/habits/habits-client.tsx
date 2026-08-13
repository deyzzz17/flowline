'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Flame,
  Plus,
  BarChart2,
  Check,
  Pencil,
  Trash2,
  Archive,
  Target,
  Trophy,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  toggleHabitCompletion,
  createHabit,
  updateHabit,
  archiveHabit,
  deleteHabit,
  listHabits,
  listArchivedHabits,
  listPlanArchivedHabits,
  restoreArchivedHabit,
  type HabitWithStats,
  type HabitData,
  type ArchivedHabit,
} from '@/api/habits/actions'
import { HabitFormDialog } from './habit-form-dialog'
import { HabitTrackingDialog } from './habit-tracking-dialog'
import { HabitArchivesDrawer } from './habits-archives-drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useToggleHabit } from '@/hooks/habits/use-toggle-habits'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import { useRestorePrompt } from '@/components/ui/restore-prompt-context'
import {
  LIMIT_ERRORS,
  SAFETY_CAP_ERRORS,
  isPlanUnlimited,
  type LimitError,
  type SafetyCapError,
} from '@/lib/plan-limits'
import { PlanLimitDialog } from '../ui/plan-limit-dialog'
import { SafetyCapDialog } from '../ui/safety-cap-dialog'

const FALLBACK_HABITS_LIMIT = 5

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const DAY_LABELS: Record<string, string> = {
  mon: 'Mo',
  tue: 'Tu',
  wed: 'We',
  thu: 'Th',
  fri: 'Fr',
  sat: 'Sa',
  sun: 'Su',
}
const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function isHabitActiveToday(habit: HabitWithStats): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (habit.startDate) {
    const start = new Date(habit.startDate)
    start.setHours(0, 0, 0, 0)
    if (start > today) return false
  }
  const todayDayName = DAY_NAMES[today.getDay()]
  if (habit.frequency === 'daily') return true
  if (habit.frequency === 'days_of_week') return (habit.daysOfWeek ?? []).includes(todayDayName)
  if (habit.frequency === 'times_per_week') return true
  if (habit.frequency === 'every_x_days') {
    const interval = habit.repeatEveryDays ?? 2
    const anchor = habit.startDate ? new Date(habit.startDate) : today
    anchor.setHours(0, 0, 0, 0)
    const diffDays = Math.round((today.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays % interval === 0
  }
  return true
}

function frequencyLabel(habit: HabitWithStats): string {
  if (habit.frequency === 'daily') return 'Every day'
  if (habit.frequency === 'every_x_days') return `Every ${habit.repeatEveryDays ?? 2} days`
  if (habit.frequency === 'times_per_week') return `${habit.timesPerWeek}× per week`
  if (habit.frequency === 'days_of_week' && habit.daysOfWeek?.length) {
    if (habit.daysOfWeek.length === 7) return 'Every day'
    return habit.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ')
  }
  return ''
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null
  return (
    <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5">
      <Flame className="h-3 w-3 text-orange-500" />
      <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
        {streak}
      </span>
    </div>
  )
}

function CompletionRing({ rate, color }: { rate: number; color: string }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = (rate / 100) * circ
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="text-muted/30"
      />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text
        x="22"
        y="26"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="currentColor"
        className="text-foreground"
      >
        {rate}%
      </text>
    </svg>
  )
}

function GoalBadge({ habit }: { habit: HabitWithStats }) {
  const goals = habit.goals ?? []
  const activeGoals = goals.filter((g) => !g.completedAt)
  if (activeGoals.length === 0) return null
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Target className="h-3 w-3 text-muted-foreground/50 shrink-0" />
      <span className="text-[11px] text-muted-foreground/60 truncate">
        {activeGoals.length === 1 ? activeGoals[0].description : `${activeGoals.length} goals`}
      </span>
    </div>
  )
}

function hasClaimableGoal(habit: HabitWithStats): boolean {
  return (habit.claimableGoalIds?.length ?? 0) > 0
}

function HabitCard({
  habit,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
}: {
  habit: HabitWithStats
  onToggle: (h: HabitWithStats) => void
  onEdit: (h: HabitWithStats) => void
  onArchive: (h: HabitWithStats) => void
  onDelete: (h: HabitWithStats) => void
}) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-background transition-all',
        habit.completedToday
          ? 'border-border/30 opacity-75'
          : hasClaimableGoal(habit)
            ? 'border-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.2)]'
            : 'border-border/60 hover:border-border',
      )}
    >
      <div className="flex items-center gap-4 p-4">
        <button
          type="button"
          onClick={() => onToggle(habit)}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all',
            habit.completedToday
              ? 'border-transparent text-white'
              : 'border-border/60 text-transparent hover:border-current',
          )}
          style={
            habit.completedToday
              ? { backgroundColor: habit.color }
              : { borderColor: habit.color + '60' }
          }
        >
          <Check
            className="h-5 w-5 transition-all"
            style={{ color: habit.completedToday ? 'white' : habit.color }}
            strokeWidth={3}
          />
        </button>

        {hasClaimableGoal(habit) && (
          <Link href={`/habits/${habit.slug}`} className="shrink-0">
            <div className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5">
              <Trophy className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                Claim
              </span>
            </div>
          </Link>
        )}

        <Link href={`/habits/${habit.slug}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'text-sm font-semibold transition-colors',
                habit.completedToday ? 'line-through text-muted-foreground/60' : 'text-foreground',
              )}
            >
              {habit.name}
            </span>
            <StreakBadge streak={habit.currentStreak} />
            {habit.categoryTag && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {habit.categoryTag}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{frequencyLabel(habit)}</p>
          <GoalBadge habit={habit} />
        </Link>

        <div className="shrink-0">
          <CompletionRing rate={habit.completionRate30d} color={habit.color} />
        </div>

        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(habit)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => onArchive(habit)}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(habit)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {habit.frequency === 'days_of_week' && habit.daysOfWeek?.length && (
        <div className="flex gap-1 px-4 pb-3">
          {ALL_DAYS.map((day) => (
            <span
              key={day}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-colors',
                habit.daysOfWeek?.includes(day)
                  ? 'text-white'
                  : 'bg-muted text-muted-foreground/40',
              )}
              style={habit.daysOfWeek?.includes(day) ? { backgroundColor: habit.color } : undefined}
            >
              {DAY_LABELS[day]}
            </span>
          ))}
        </div>
      )}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ backgroundColor: habit.color }}
      />
    </div>
  )
}

function InactiveHabitCard({
  habit,
  onEdit,
  onArchive,
  onDelete,
}: {
  habit: HabitWithStats
  onEdit: (h: HabitWithStats) => void
  onArchive: (h: HabitWithStats) => void
  onDelete: (h: HabitWithStats) => void
}) {
  const nextOccurrence = (): string => {
    if (habit.startDate) {
      const start = new Date(habit.startDate)
      start.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (start > today)
        return `Starts ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
    if (habit.frequency === 'every_x_days') {
      const interval = habit.repeatEveryDays ?? 2
      const anchor = habit.startDate ? new Date(habit.startDate) : new Date()
      anchor.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      for (let i = 1; i <= interval; i++) {
        const next = new Date(today)
        next.setDate(today.getDate() + i)
        const diff = Math.round((next.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24))
        if (diff % interval === 0) return i === 1 ? 'Tomorrow' : `In ${i} days`
      }
    }
    if (habit.frequency === 'days_of_week') {
      const today = new Date()
      const todayIdx = today.getDay()
      const dayIndices: Record<string, number> = {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
      }
      const targets = (habit.daysOfWeek ?? []).map((d) => dayIndices[d]).sort((a, b) => a - b)
      for (let i = 1; i <= 7; i++) {
        const nextIdx = (todayIdx + i) % 7
        if (targets.includes(nextIdx)) return i === 1 ? 'Tomorrow' : `In ${i} days`
      }
    }
    return 'Not today'
  }

  return (
    <div className="group relative rounded-2xl border border-border/40 bg-muted/20 transition-all hover:border-border/60">
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border/40">
          <Moon className="h-4 w-4 text-muted-foreground/30" />
        </div>
        <Link href={`/habits/${habit.slug}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-muted-foreground/60">{habit.name}</span>
            <StreakBadge streak={habit.currentStreak} />
            {habit.categoryTag && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground/50">
                {habit.categoryTag}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground/50">{frequencyLabel(habit)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/40">{nextOccurrence()}</p>
        </Link>
        <div className="shrink-0 opacity-50">
          <CompletionRing rate={habit.completionRate30d} color={habit.color} />
        </div>
        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(habit)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => onArchive(habit)}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(habit)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {habit.frequency === 'days_of_week' && habit.daysOfWeek?.length && (
        <div className="flex gap-1 px-4 pb-3">
          {ALL_DAYS.map((day) => (
            <span
              key={day}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold',
                habit.daysOfWeek?.includes(day)
                  ? 'opacity-40'
                  : 'bg-muted text-muted-foreground/30',
              )}
              style={
                habit.daysOfWeek?.includes(day)
                  ? { backgroundColor: habit.color + '60', color: 'white' }
                  : undefined
              }
            >
              {DAY_LABELS[day]}
            </span>
          ))}
        </div>
      )}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full opacity-30"
        style={{ backgroundColor: habit.color }}
      />
    </div>
  )
}

interface HabitsClientProps {
  initialHabits: HabitWithStats[]
}

export function HabitsClient({ initialHabits }: HabitsClientProps) {
  const queryClient = useQueryClient()
  const { toggle: toggleHabit } = useToggleHabit()
  const planLimits = usePlanLimits()
  const { openPrompt } = useRestorePrompt()
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const lastDateRef = useRef<string>(
    new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }).format(new Date()),
  )
  useEffect(() => {
    const checkDayChange = () => {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }).format(new Date())
      if (today !== lastDateRef.current) {
        lastDateRef.current = today
        queryClient.invalidateQueries({ queryKey: ['habits'] })
      }
    }
    window.addEventListener('focus', checkDayChange)
    const interval = setInterval(checkDayChange, 60_000)
    return () => {
      window.removeEventListener('focus', checkDayChange)
      clearInterval(interval)
    }
  }, [queryClient, userTimezone])

  const { data: habits = initialHabits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => listHabits(userTimezone),
    initialData: initialHabits,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const todayHabits = habits.filter(isHabitActiveToday)
  const inactiveHabits = habits.filter((h) => !isHabitActiveToday(h))
  const todayCompleted = todayHabits.filter((h) => h.completedToday).length

  const [formOpen, setFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HabitWithStats | null>(null)
  const [trackingHabit, setTrackingHabit] = useState<HabitWithStats | null>(null)
  const [archivesOpen, setArchivesOpen] = useState(false)
  const [archives, setArchives] = useState<ArchivedHabit[] | null>(null)
  const [archivesLoading, setArchivesLoading] = useState(false)
  const [inactiveExpanded, setInactiveExpanded] = useState(false)
  const [limitError, setLimitError] = useState<LimitError | null>(null)
  const [capError, setCapError] = useState<SafetyCapError | null>(null)

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['habits'] })

  const handleOpenArchives = async () => {
    setArchivesOpen(true)
    setArchivesLoading(true)
    const data = await listArchivedHabits()
    setArchives(data)
    setArchivesLoading(false)
  }

  const handleToggle = (habit: HabitWithStats) => {
    const activeFields = (habit.trackingFields ?? []).filter((f) => f.enabled)
    if (activeFields.length > 0 && !habit.completedToday) {
      setTrackingHabit(habit)
      return
    }
    toggleHabit({ habit, timezone: userTimezone })
  }

  const handleTrackingSubmit = async (values: Record<string, number | string | boolean>) => {
    if (!trackingHabit) return
    const habit = trackingHabit
    setTrackingHabit(null)
    queryClient.setQueryData<HabitWithStats[]>(
      ['habits'],
      (old) =>
        old?.map((h) =>
          h.id === habit.id
            ? { ...h, completedToday: true, currentStreak: h.currentStreak + 1 }
            : h,
        ) ?? old,
    )
    const result = await toggleHabitCompletion(habit.id, undefined, values, userTimezone)
    if ('error' in result) {
      toast.error('Failed to update habit')
      refresh()
      return
    }
    refresh()
  }

  const handleTrackingSkip = () => {
    if (!trackingHabit) return
    const habit = trackingHabit
    setTrackingHabit(null)
    toggleHabit({ habit, timezone: userTimezone })
  }

  const handleCreate = async (data: HabitData) => {
    const snapshot = queryClient.getQueryData<HabitWithStats[]>(['habits'])

    const tempHabit: HabitWithStats = {
      id: -Date.now(),
      slug: '',
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? '#f97316',
      categoryTag: data.categoryTag ?? null,
      frequency: data.frequency,
      daysOfWeek: data.daysOfWeek ?? [],
      timesPerWeek: data.timesPerWeek,
      currentStreak: 0,
      longestStreak: 0,
      completedToday: false,
      completionRate30d: 0,
      order: habits.length,
      startDate: data.startDate ?? null,
      showInCalendar: data.showInCalendar ?? false,
      trackingFields: data.trackingFields ?? [],
      goals: data.goals ?? [],
      claimableGoalIds: [],
      repeatEveryDays: data.repeatEveryDays,
    }
    queryClient.setQueryData<HabitWithStats[]>(['habits'], (old) =>
      old ? [...old, tempHabit] : [tempHabit],
    )

    const result = await createHabit(data)
    if (!result.ok) {
      if (snapshot) queryClient.setQueryData(['habits'], snapshot)

      if (result.error === LIMIT_ERRORS.HABITS_LIMIT) {
        setLimitError(LIMIT_ERRORS.HABITS_LIMIT)
        return
      }
      if (result.error === SAFETY_CAP_ERRORS.HABITS_CAP) {
        setCapError(SAFETY_CAP_ERRORS.HABITS_CAP)
        return
      }
      if (result.error === LIMIT_ERRORS.TRACKING_FIELDS_LIMIT) {
        setLimitError(LIMIT_ERRORS.TRACKING_FIELDS_LIMIT)
        return
      }
      if (result.error === SAFETY_CAP_ERRORS.TRACKING_FIELDS_CAP) {
        setCapError(SAFETY_CAP_ERRORS.TRACKING_FIELDS_CAP)
        return
      }
      if (result.error === LIMIT_ERRORS.GOALS_LIMIT) {
        setLimitError(LIMIT_ERRORS.GOALS_LIMIT)
        return
      }
      if (result.error === SAFETY_CAP_ERRORS.GOALS_CAP) {
        setCapError(SAFETY_CAP_ERRORS.GOALS_CAP)
        return
      }

      toast.error('Failed to create habit')
      return
    }
    toast.success('Habit created')
    refresh()
  }

  const handleUpdate = async (data: HabitData) => {
    if (!editingHabit) return
    const snapshot = queryClient.getQueryData<HabitWithStats[]>(['habits'])

    queryClient.setQueryData<HabitWithStats[]>(
      ['habits'],
      (old) =>
        old?.map((h) =>
          h.id === editingHabit.id
            ? {
                ...h,
                name: data.name,
                description: data.description ?? null,
                color: data.color ?? h.color,
                categoryTag: data.categoryTag ?? null,
                frequency: data.frequency,
                daysOfWeek: data.daysOfWeek ?? h.daysOfWeek,
                timesPerWeek: data.timesPerWeek ?? h.timesPerWeek,
                startDate: data.startDate ?? h.startDate,
                showInCalendar: data.showInCalendar ?? h.showInCalendar,
                trackingFields: data.trackingFields ?? h.trackingFields,
                goals: data.goals ?? h.goals,
                repeatEveryDays: data.repeatEveryDays ?? h.repeatEveryDays,
              }
            : h,
        ) ?? old,
    )
    setEditingHabit(null)

    const result = await updateHabit(editingHabit.id, data)
    if (!result.ok) {
      if (snapshot) queryClient.setQueryData(['habits'], snapshot)

      if (result.error === LIMIT_ERRORS.TRACKING_FIELDS_LIMIT) {
        setLimitError(LIMIT_ERRORS.TRACKING_FIELDS_LIMIT)
        return
      }
      if (result.error === SAFETY_CAP_ERRORS.TRACKING_FIELDS_CAP) {
        setCapError(SAFETY_CAP_ERRORS.TRACKING_FIELDS_CAP)
        return
      }
      if (result.error === LIMIT_ERRORS.GOALS_LIMIT) {
        setLimitError(LIMIT_ERRORS.GOALS_LIMIT)
        return
      }
      if (result.error === SAFETY_CAP_ERRORS.GOALS_CAP) {
        setCapError(SAFETY_CAP_ERRORS.GOALS_CAP)
        return
      }

      toast.error('Failed to update habit')
      return
    }
    toast.success('Habit updated')
    refresh()
  }

  const handleArchive = async (habit: HabitWithStats) => {
    const result = await archiveHabit(habit.id)
    if ('error' in result) {
      toast.error('Failed to archive habit')
      return
    }
    toast.success('Habit archived')
    refresh()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteHabit(deleteTarget.id)
    if ('error' in result) {
      toast.error('Failed to delete habit')
      return
    }
    toast.success('Habit deleted')
    setDeleteTarget(null)
    refresh()

    const archived = await listPlanArchivedHabits()
    if (archived.length === 0) return

    const habitsLimit = planLimits?.limits.habits ?? FALLBACK_HABITS_LIMIT
    const activeCount = Math.max(0, habits.length - 1)
    const room =
      planLimits && isPlanUnlimited(planLimits.plan, 'habits')
        ? archived.length
        : Math.max(0, habitsLimit - activeCount)

    if (room <= 0) return

    openPrompt({
      title: 'Restore an archived habit?',
      description:
        'You have habits that were archived when your plan changed. Restore some now that you have room.',
      items: archived.map((h) => ({ id: h.id, label: h.name, color: h.color })),
      maxSelectable: room,
      onConfirm: async (ids) => {
        const results = await Promise.all(ids.map((id) => restoreArchivedHabit(id)))
        const allOk = results.every((r) => r.ok)

        queryClient.invalidateQueries({ queryKey: ['habits'] })

        if (allOk) {
          toast.info(ids.length > 1 ? 'Habits restored' : 'Habit restored')
        } else {
          toast.error('Some habits could not be restored', { description: 'Please try again.' })
        }

        return { ok: allOk }
      },
    })
  }

  const cardProps = {
    onToggle: handleToggle,
    onEdit: setEditingHabit,
    onArchive: handleArchive,
    onDelete: setDeleteTarget,
  }
  const inactiveCardProps = {
    onEdit: setEditingHabit,
    onArchive: handleArchive,
    onDelete: setDeleteTarget,
  }

  return (
    <div className="pt-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
              Habits
            </p>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Daily habits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {todayCompleted}/{todayHabits.length} completed today
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:w-auto sm:px-3 sm:gap-1.5"
            onClick={handleOpenArchives}
          >
            <Archive className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline text-xs">Archives</span>
          </Button>
          <Link href="/habits/habits-analytics">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:w-auto sm:px-3 sm:gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline text-xs">Analytics</span>
            </Button>
          </Link>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New habit</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
            <Flame className="h-8 w-8 text-orange-500" />
          </div>
          <p className="text-base font-semibold text-foreground">No habits yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Start building routines that stick.</p>
          <Button className="mt-6 gap-2" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Create your first habit
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {todayHabits.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-600 dark:text-orange-400">
                    Today
                  </span>
                  <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                    {todayCompleted}/{todayHabits.length}
                  </span>
                </div>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-500"
                  style={{
                    width: `${todayHabits.length > 0 ? (todayCompleted / todayHabits.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="space-y-3">
                {todayHabits.map((habit) => (
                  <HabitCard key={habit.id} habit={habit} {...cardProps} />
                ))}
              </div>
            </div>
          )}

          {inactiveHabits.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setInactiveExpanded((v) => !v)}
                className="flex items-center gap-2 mb-3 group"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                  Inactive today
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground/60">
                  {inactiveHabits.length}
                </span>
                <span className="text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                  {inactiveExpanded ? '▲ hide' : '▼ show'}
                </span>
              </button>
              {inactiveExpanded && (
                <div className="space-y-2">
                  {inactiveHabits.map((habit) => (
                    <InactiveHabitCard key={habit.id} habit={habit} {...inactiveCardProps} />
                  ))}
                </div>
              )}
            </div>
          )}

          {todayHabits.length === 0 && inactiveHabits.length > 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Moon className="h-8 w-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-semibold text-foreground">Nothing to do today</p>
              <p className="mt-1 text-xs text-muted-foreground">
                All your habits are scheduled for other days.
              </p>
            </div>
          )}
        </div>
      )}

      <HabitTrackingDialog
        open={!!trackingHabit}
        habitName={trackingHabit?.name ?? ''}
        habitColor={trackingHabit?.color ?? '#8b5cf6'}
        fields={(trackingHabit?.trackingFields ?? []).filter((f) => f.enabled)}
        onSubmit={handleTrackingSubmit}
        onSkip={handleTrackingSkip}
        onClose={() => setTrackingHabit(null)}
      />

      <HabitFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
      <HabitFormDialog
        open={!!editingHabit}
        onOpenChange={(v) => {
          if (!v) setEditingHabit(null)
        }}
        onSubmit={handleUpdate}
        initialData={editingHabit ?? undefined}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this habit?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> and all its completion history will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlanLimitDialog
        open={!!limitError}
        onOpenChange={(v) => {
          if (!v) setLimitError(null)
        }}
        limitError={limitError}
      />
      <SafetyCapDialog
        open={!!capError}
        onOpenChange={(v) => {
          if (!v) setCapError(null)
        }}
        capError={capError}
      />

      <HabitArchivesDrawer
        open={archivesOpen}
        archives={archives}
        loading={archivesLoading}
        onClose={() => {
          setArchivesOpen(false)
          setArchives(null)
        }}
        onRestored={() => {
          setArchivesOpen(false)
          setArchives(null)
          refresh()
        }}
        onDeleted={(id) => setArchives((prev) => prev?.filter((h) => h.id !== id) ?? null)}
      />
    </div>
  )
}
