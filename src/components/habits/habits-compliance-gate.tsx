'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Flame, ListChecks, Target, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  checkHabitsCompliance,
  chooseHabitsToKeep,
  checkTrackingFieldsComplianceForUser,
  chooseTrackingFieldsToKeep,
  checkGoalsComplianceForUser,
  chooseGoalsToKeep,
  type HabitTrackingFieldsOverLimit,
  type HabitGoalsOverLimit,
} from '@/api/habits/actions'
import { PlanSelectionDialog } from '@/components/ui/plan-selection-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface HabitsComplianceInfo {
  overBy: number
  limit: number
  habits: { id: number; name: string; color?: string | null }[]
}

type Step =
  | { kind: 'idle' }
  | { kind: 'habits'; info: HabitsComplianceInfo }
  | { kind: 'trackingFields'; limit: number; queue: HabitTrackingFieldsOverLimit[]; index: number }
  | { kind: 'goals'; limit: number; queue: HabitGoalsOverLimit[]; index: number }

export function HabitsComplianceGate() {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>({ kind: 'idle' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const runGoalsCheck = useCallback(async () => {
    const result = await checkGoalsComplianceForUser()
    if (result && result.habits.length > 0) {
      setStep({ kind: 'goals', limit: result.limit, queue: result.habits, index: 0 })
    } else {
      setStep({ kind: 'idle' })
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    }
  }, [queryClient])

  const runTrackingFieldsCheck = useCallback(async () => {
    const result = await checkTrackingFieldsComplianceForUser()
    if (result && result.habits.length > 0) {
      setStep({ kind: 'trackingFields', limit: result.limit, queue: result.habits, index: 0 })
    } else {
      await runGoalsCheck()
    }
  }, [runGoalsCheck])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await checkHabitsCompliance()
      if (cancelled) return
      if (result && result.habits.length > 0) {
        setStep({ kind: 'habits', info: result })
      } else {
        await runTrackingFieldsCheck()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [runTrackingFieldsCheck])

  if (step.kind === 'idle') return null

  if (step.kind === 'habits') {
    const { info } = step
    return (
      <PlanSelectionDialog
        icon={<Flame className="h-4 w-4 text-orange-500" />}
        title="Choose which habits to keep"
        description={
          <>
            Your current plan allows <strong>{info.limit}</strong> habit
            {info.limit !== 1 ? 's' : ''}, but you have <strong>{info.habits.length}</strong>.
            Choose which ones to keep — the rest will be archived, not deleted. All their history
            and progress is kept and comes back exactly as it was as soon as you have room again.
          </>
        }
        items={info.habits.map((h) => ({ id: h.id, label: h.name, color: h.color ?? '#8b5cf6' }))}
        limit={info.limit}
        isSubmitting={isSubmitting}
        confirmLabel="Confirm selection"
        onConfirm={async (keepIds) => {
          setIsSubmitting(true)
          try {
            const result = await chooseHabitsToKeep(keepIds)
            if (!result.ok) {
              toast.error('Something went wrong. Please try again.')
              return
            }
            toast.info('Habits updated', {
              description: `${info.habits.length - info.limit} habit${info.habits.length - info.limit !== 1 ? 's' : ''} archived. You can restore them later.`,
            })
            queryClient.invalidateQueries({ queryKey: ['habits'] })
            await runTrackingFieldsCheck()
          } catch {
            toast.error('Something went wrong. Please try again.')
          } finally {
            setIsSubmitting(false)
          }
        }}
      />
    )
  }

  if (step.kind === 'trackingFields') {
    const current = step.queue[step.index]
    return (
      <TrackingFieldsComplianceStep
        key={current.habitId}
        limit={step.limit}
        habit={current}
        position={step.index + 1}
        total={step.queue.length}
        isSubmitting={isSubmitting}
        onConfirm={async (keepKeys) => {
          setIsSubmitting(true)
          try {
            const result = await chooseTrackingFieldsToKeep(current.habitId, keepKeys)
            if (!result.ok) {
              toast.error('Something went wrong. Please try again.')
              return
            }
            const nextIndex = step.index + 1
            if (nextIndex < step.queue.length) {
              setStep({ kind: 'trackingFields', limit: step.limit, queue: step.queue, index: nextIndex })
            } else {
              await runGoalsCheck()
            }
          } catch {
            toast.error('Something went wrong. Please try again.')
          } finally {
            setIsSubmitting(false)
          }
        }}
      />
    )
  }

  const current = step.queue[step.index]
  return (
    <GoalsComplianceStep
      key={current.habitId}
      limit={step.limit}
      habit={current}
      position={step.index + 1}
      total={step.queue.length}
      isSubmitting={isSubmitting}
      onConfirm={async (keepGoalIds) => {
        setIsSubmitting(true)
        try {
          const result = await chooseGoalsToKeep(current.habitId, keepGoalIds)
          if (!result.ok) {
            toast.error('Something went wrong. Please try again.')
            return
          }
          const nextIndex = step.index + 1
          if (nextIndex < step.queue.length) {
            setStep({ kind: 'goals', limit: step.limit, queue: step.queue, index: nextIndex })
          } else {
            setStep({ kind: 'idle' })
            queryClient.invalidateQueries({ queryKey: ['habits'] })
          }
        } catch {
          toast.error('Something went wrong. Please try again.')
        } finally {
          setIsSubmitting(false)
        }
      }}
    />
  )
}

function TrackingFieldsComplianceStep({
  limit,
  habit,
  position,
  total,
  isSubmitting,
  onConfirm,
}: {
  limit: number
  habit: HabitTrackingFieldsOverLimit
  position: number
  total: number
  isSubmitting: boolean
  onConfirm: (keepKeys: string[]) => void
}) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(habit.trackingFields.slice(0, limit).map((f) => f.key)),
  )
  const selectedCount = selectedKeys.size
  const isValid = selectedCount === limit

  const toggle = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        if (next.size >= limit) return prev
        next.add(key)
      }
      return next
    })
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-amber-500" />
            Choose tracking fields to keep
            {total > 1 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {position} / {total}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{habit.habitName}</strong> has more tracking
            fields than your plan allows (<strong>{limit}</strong> max). Choose which to keep —{' '}
            <strong className="text-destructive">the rest will be permanently deleted</strong>,
            this cannot be undone.
          </p>

          <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-border/50 p-2">
            {habit.trackingFields.map((field) => {
              const isSelected = selectedKeys.has(field.key)
              const disabled = !isSelected && selectedCount >= limit
              return (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => toggle(field.key)}
                  disabled={disabled}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
                    isSelected
                      ? 'border-violet-500/40 bg-violet-500/10'
                      : disabled
                        ? 'border-border/30 opacity-40 cursor-not-allowed'
                        : 'border-border/60 bg-background hover:bg-muted',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all',
                      isSelected ? 'border-violet-500 bg-violet-500' : 'border-border/60',
                    )}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="flex-1 truncate font-medium text-foreground">
                    {field.label}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="text-center text-xs font-medium text-muted-foreground">
            {selectedCount} / {limit} selected
          </p>
        </div>

        <DialogFooter className="pt-1">
          <button
            type="button"
            onClick={() => onConfirm(Array.from(selectedKeys))}
            disabled={!isValid || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white transition-all hover:bg-destructive/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : total > 1 && position < total ? (
              `Confirm & continue (${position}/${total})`
            ) : (
              `Keep ${limit}, delete the rest`
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GoalsComplianceStep({
  limit,
  habit,
  position,
  total,
  isSubmitting,
  onConfirm,
}: {
  limit: number
  habit: HabitGoalsOverLimit
  position: number
  total: number
  isSubmitting: boolean
  onConfirm: (keepGoalIds: string[]) => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(habit.goals.slice(0, limit).map((g) => g.id)),
  )
  const selectedCount = selectedIds.size
  const isValid = selectedCount === limit

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= limit) return prev
        next.add(id)
      }
      return next
    })
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-500" />
            Choose goals to keep
            {total > 1 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {position} / {total}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{habit.habitName}</strong> has more goals than
            your plan allows (<strong>{limit}</strong> max). Choose which to keep —{' '}
            <strong className="text-destructive">the rest will be permanently deleted</strong>,
            this cannot be undone.
          </p>

          <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-border/50 p-2">
            {habit.goals.map((goal) => {
              const isSelected = selectedIds.has(goal.id)
              const disabled = !isSelected && selectedCount >= limit
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggle(goal.id)}
                  disabled={disabled}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
                    isSelected
                      ? 'border-violet-500/40 bg-violet-500/10'
                      : disabled
                        ? 'border-border/30 opacity-40 cursor-not-allowed'
                        : 'border-border/60 bg-background hover:bg-muted',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all',
                      isSelected ? 'border-violet-500 bg-violet-500' : 'border-border/60',
                    )}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span
                    className={cn(
                      'flex-1 truncate',
                      goal.completedAt
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground',
                    )}
                  >
                    {goal.description}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="text-center text-xs font-medium text-muted-foreground">
            {selectedCount} / {limit} selected
          </p>
        </div>

        <DialogFooter className="pt-1">
          <button
            type="button"
            onClick={() => onConfirm(Array.from(selectedIds))}
            disabled={!isValid || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white transition-all hover:bg-destructive/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : total > 1 && position < total ? (
              `Confirm & continue (${position}/${total})`
            ) : (
              `Keep ${limit}, delete the rest`
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
