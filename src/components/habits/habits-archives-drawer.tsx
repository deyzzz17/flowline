'use client'

import { useState, useTransition } from 'react'
import { X, Archive, RotateCcw, Trash2, Flame, Calendar, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  listArchivedHabits,
  restoreHabit,
  deleteHabit,
  type ArchivedHabit,
} from '@/api/habits/actions'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'

const DAY_LABELS: Record<string, string> = {
  mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su',
}

function frequencyLabel(habit: ArchivedHabit): string {
  if (habit.frequency === 'daily') return 'Every day'
  if (habit.frequency === 'times_per_week') return `${habit.timesPerWeek}× per week`
  if (habit.frequency === 'days_of_week' && habit.daysOfWeek?.length)
    return habit.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ')
  return ''
}

function daysUntilDeletion(archivedAt: string): number {
  const archived = new Date(archivedAt)
  const deleteAt = new Date(archived)
  deleteAt.setDate(deleteAt.getDate() + 30)
  const diff = Math.ceil((deleteAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

interface HabitArchivesDrawerProps {
  open: boolean
  onClose: () => void
  onRestored: () => void
}

export function HabitArchivesDrawer({ open, onClose, onRestored }: HabitArchivesDrawerProps) {
  const queryClient = useQueryClient()
  const [archives, setArchives] = useState<ArchivedHabit[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ArchivedHabit | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadArchives = async () => {
    setLoading(true)
    const data = await listArchivedHabits()
    setArchives(data)
    setLoading(false)
  }

  if (open && archives === null && !loading) {
    loadArchives()
  }

  const handleRestore = async (habit: ArchivedHabit) => {
    startTransition(async () => {
      const result = await restoreHabit(habit.id)
      if ('error' in result) {
        toast.error('Failed to restore habit')
        return
      }
      toast.success(`${habit.name} restored`)
      setArchives((prev) => prev?.filter((h) => h.id !== habit.id) ?? null)
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      onRestored()
    })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteHabit(deleteTarget.id)
      if ('error' in result) {
        toast.error('Failed to delete habit')
        return
      }
      toast.success(`${deleteTarget.name} permanently deleted`)
      setArchives((prev) => prev?.filter((h) => h.id !== deleteTarget.id) ?? null)
      setDeleteTarget(null)
    })
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border/60 bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground/60" />
            <p className="text-sm font-semibold text-foreground">Archived habits</p>
            {archives && archives.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {archives.length}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border/40 bg-amber-500/5 px-5 py-2.5">
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            Archived habits are automatically deleted after 30 days of inactivity.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
            </div>
          ) : archives === null || archives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Archive className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No archived habits</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Habits you archive will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {archives.map((habit) => {
                const daysLeft = daysUntilDeletion(habit.archivedAt)
                const isUrgent = daysLeft <= 7
                return (
                  <div key={habit.id}
                    className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: habit.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{habit.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{frequencyLabel(habit)}</p>
                        {habit.categoryTag && (
                          <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {habit.categoryTag}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-3 w-3 text-orange-500" />
                        <span className="text-[11px] text-muted-foreground">
                          Best streak: <strong className="text-foreground">{habit.longestStreak}d</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-violet-500" />
                        <span className="text-[11px] text-muted-foreground">
                          <strong className="text-foreground">{habit.totalCompletions}</strong> completions
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground/60">
                          Archived {formatDistanceToNow(new Date(habit.archivedAt), { addSuffix: true })}
                        </p>
                        <p className={cn('text-[10px] font-medium mt-0.5',
                          isUrgent ? 'text-destructive' : 'text-muted-foreground/50'
                        )}>
                          {daysLeft === 0 ? 'Deletes today' : `Deletes in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs"
                          disabled={isPending}
                          onClick={() => handleRestore(habit)}>
                          <RotateCcw className="h-3 w-3" />
                          Restore
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          disabled={isPending}
                          onClick={() => setDeleteTarget(habit)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> and all its completion history will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">Delete permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}