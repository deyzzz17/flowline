'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, AlertTriangle, ListChecks, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  checkTasksCompliance,
  chooseTasksToKeep,
  checkSubtasksComplianceForList,
  chooseSubtasksToKeep,
  type SubtasksOverLimitTask,
} from '@/api/tasks/actions'
import type { Task } from '@/payload-types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

type Step =
  | { kind: 'idle' }
  | { kind: 'tasks'; limit: number; tasks: Task[] }
  | { kind: 'subtasks'; limit: number; queue: SubtasksOverLimitTask[]; index: number }

interface TasksSubtasksComplianceGateProps {
  listId: number
}

export function TasksSubtasksComplianceGate({ listId }: TasksSubtasksComplianceGateProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>({ kind: 'idle' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const runSubtasksCheck = useCallback(async () => {
    const result = await checkSubtasksComplianceForList(listId)
    if (result && result.tasks.length > 0) {
      setStep({ kind: 'subtasks', limit: result.limit, queue: result.tasks, index: 0 })
    } else {
      setStep({ kind: 'idle' })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  }, [listId, queryClient])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await checkTasksCompliance(listId)
      if (cancelled) return
      if (result && result.tasks.length > 0) {
        setStep({ kind: 'tasks', limit: result.limit, tasks: result.tasks })
      } else {
        await runSubtasksCheck()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [listId])

  if (step.kind === 'idle') return null

  if (step.kind === 'tasks') {
    return (
      <TasksComplianceStep
        limit={step.limit}
        tasks={step.tasks}
        isSubmitting={isSubmitting}
        onConfirm={async (keepIds) => {
          setIsSubmitting(true)
          try {
            const result = await chooseTasksToKeep(listId, keepIds)
            if (!result.ok) {
              toast.error('Something went wrong. Please try again.')
              return
            }
            toast.info('Tasks updated', {
              description: `${result.value.deletedCount} task${result.value.deletedCount !== 1 ? 's' : ''} permanently deleted.`,
            })
            await runSubtasksCheck()
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
    <SubtasksComplianceStep
      key={current.taskId}
      limit={step.limit}
      task={current}
      position={step.index + 1}
      total={step.queue.length}
      isSubmitting={isSubmitting}
      onConfirm={async (keepSubtaskIds) => {
        setIsSubmitting(true)
        try {
          const result = await chooseSubtasksToKeep(current.taskId, keepSubtaskIds)
          if (!result.ok) {
            toast.error('Something went wrong. Please try again.')
            return
          }
          const nextIndex = step.index + 1
          if (nextIndex < step.queue.length) {
            setStep({ kind: 'subtasks', limit: step.limit, queue: step.queue, index: nextIndex })
          } else {
            setStep({ kind: 'idle' })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
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

function TasksComplianceStep({
  limit,
  tasks,
  isSubmitting,
  onConfirm,
}: {
  limit: number
  tasks: Task[]
  isSubmitting: boolean
  onConfirm: (keepIds: number[]) => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(tasks.slice(0, limit).map((t) => t.id)),
  )
  const selectedCount = selectedIds.size
  const isValid = selectedCount === limit

  const toggle = (id: number) => {
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
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Choose which tasks to keep
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">
            This list has more tasks than your plan allows (<strong>{limit}</strong> max). Choose
            which to keep —{' '}
            <strong className="text-destructive">the rest will be permanently deleted</strong>, this
            cannot be undone.
          </p>

          <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-border/50 p-2">
            {tasks.map((task) => {
              const isSelected = selectedIds.has(task.id)
              const disabled = !isSelected && selectedCount >= limit
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggle(task.id)}
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
                      'flex-1 truncate font-medium',
                      task.status === 'completed'
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground',
                    )}
                  >
                    {task.title}
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
            ) : (
              `Keep ${limit}, delete the rest`
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SubtasksComplianceStep({
  limit,
  task,
  position,
  total,
  isSubmitting,
  onConfirm,
}: {
  limit: number
  task: SubtasksOverLimitTask
  position: number
  total: number
  isSubmitting: boolean
  onConfirm: (keepSubtaskIds: string[]) => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(task.subtasks.slice(0, limit).map((s) => s.id)),
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
            <ListChecks className="h-4 w-4 text-amber-500" />
            Choose subtasks to keep
            {total > 1 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {position} / {total}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{task.title}</strong> has more subtasks than your
            plan allows (<strong>{limit}</strong> max). Choose which to keep{' '}
            <strong className="text-destructive">the rest will be permanently deleted</strong>, this
            cannot be undone.
          </p>

          <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-border/50 p-2">
            {task.subtasks.map((subtask) => {
              const isSelected = selectedIds.has(subtask.id)
              const disabled = !isSelected && selectedCount >= limit
              return (
                <button
                  key={subtask.id}
                  type="button"
                  onClick={() => toggle(subtask.id)}
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
                      subtask.done ? 'text-muted-foreground line-through' : 'text-foreground',
                    )}
                  >
                    {subtask.title}
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
