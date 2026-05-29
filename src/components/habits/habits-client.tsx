'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Flame, Plus, BarChart2, Check, Pencil, Trash2, Archive, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  toggleHabitCompletion,
  createHabit,
  updateHabit,
  archiveHabit,
  deleteHabit,
  listHabits,
  type HabitWithStats,
  type HabitData,
} from '@/api/habits/actions'
import { HabitFormDialog } from './habit-form-dialog'
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

function frequencyLabel(habit: HabitWithStats): string {
  if (habit.frequency === 'daily') return 'Every day'
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

interface HabitsClientProps {
  initialHabits: HabitWithStats[]
}

export function HabitsClient({ initialHabits }: HabitsClientProps) {
  const [habits, setHabits] = useState(initialHabits)
  const [formOpen, setFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HabitWithStats | null>(null)
  const [isPending, startTransition] = useTransition()
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const refresh = () => {
    startTransition(async () => {
      const fresh = await listHabits()
      setHabits(fresh)
    })
  }

  const handleToggle = async (habit: HabitWithStats) => {
    setTogglingId(habit.id)
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              completedToday: !h.completedToday,
              currentStreak: !h.completedToday
                ? h.currentStreak + 1
                : Math.max(0, h.currentStreak - 1),
            }
          : h,
      ),
    )
    const result = await toggleHabitCompletion(habit.id)
    if ('error' in result) {
      toast.error('Failed to update habit')
      refresh()
    }
    setTogglingId(null)
  }

  const handleCreate = async (data: HabitData) => {
    const result = await createHabit(data)
    if ('error' in result) {
      toast.error('Failed to create habit')
      return
    }
    toast.success('Habit created')
    setFormOpen(false)
    refresh()
  }

  const handleUpdate = async (data: HabitData) => {
    if (!editingHabit) return
    const result = await updateHabit(editingHabit.id, data)
    if ('error' in result) {
      toast.error('Failed to update habit')
      return
    }
    toast.success('Habit updated')
    setEditingHabit(null)
    refresh()
  }

  const handleArchive = async (habit: HabitWithStats) => {
    const result = await archiveHabit(habit.id)
    if ('error' in result) {
      toast.error('Failed to archive habit')
      return
    }
    toast.success('Habit archived')
    setHabits((prev) => prev.filter((h) => h.id !== habit.id))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteHabit(deleteTarget.id)
    if ('error' in result) {
      toast.error('Failed to delete habit')
      return
    }
    toast.success('Habit deleted')
    setHabits((prev) => prev.filter((h) => h.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const todayCompleted = habits.filter((h) => h.completedToday).length

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
            {todayCompleted}/{habits.length} completed today
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Link href="/habits/habits-analytics">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <BarChart2 className="h-3.5 w-3.5" />
              Analytics
            </Button>
          </Link>
          <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New habit
          </Button>
        </div>
      </div>

      {habits.length > 0 && (
        <div className="mb-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500"
              style={{
                width: `${habits.length > 0 ? (todayCompleted / habits.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

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
        <div className="space-y-3">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={cn(
                'group relative rounded-2xl border bg-background transition-all',
                habit.completedToday
                  ? 'border-border/30 opacity-75'
                  : 'border-border/60 hover:border-border',
              )}
            >
              <div className="flex items-center gap-4 p-4">
                <button
                  type="button"
                  onClick={() => handleToggle(habit)}
                  disabled={togglingId === habit.id}
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
                  {togglingId === habit.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Check
                      className="h-5 w-5 transition-all"
                      style={{ color: habit.completedToday ? 'white' : habit.color }}
                      strokeWidth={3}
                    />
                  )}
                </button>

                <Link href={`/habits/${habit.slug}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-sm font-semibold transition-colors',
                        habit.completedToday
                          ? 'line-through text-muted-foreground/60'
                          : 'text-foreground',
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
                </Link>

                <div className="shrink-0">
                  <CompletionRing rate={habit.completionRate30d} color={habit.color} />
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingHabit(habit)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-muted-foreground"
                    onClick={() => handleArchive(habit)}
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(habit)}
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
                      style={
                        habit.daysOfWeek?.includes(day)
                          ? { backgroundColor: habit.color }
                          : undefined
                      }
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
          ))}
        </div>
      )}

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
    </div>
  )
}
