'use client'

import { Checkbox } from '../ui/checkbox'
import { useTask } from '@/hooks/tasks/use-task'
import { useSoftDelete } from '@/hooks/tasks/use-soft-delete'
import { useDeleteTask } from '@/hooks/tasks/use-delete-task'
import { useRestoreTask } from '@/hooks/tasks/use-restore-task'
import { useToggleSubtask } from '@/hooks/tasks/use-toggle-subtasks'
import type { Task } from '@/payload-types'
import { Button } from '../ui/button'
import {
  TrashIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const TAG_STYLES: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-600 dark:text-red-400',
  work: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  personal: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  health: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  finance: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  learning: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
}

const TAG_LABELS: Record<string, string> = {
  urgent: 'Urgent',
  work: 'Work',
  personal: 'Personal',
  health: 'Health',
  finance: 'Finance',
  learning: 'Learning',
}

interface TaskCardProps {
  task: Task
  isEditing?: boolean
  isDisabled?: boolean
  taskManager: ReturnType<typeof useTask>
}

export const TaskCard = ({ task, isEditing, isDisabled, taskManager }: TaskCardProps) => {
  const { toggleStatus, isUpdating, startEditing, stopEditing, saveEdit, draft, updateDraft } =
    taskManager

  const softDelete = useSoftDelete()
  const deleteTask = useDeleteTask()
  const restoreTask = useRestoreTask()
  const toggleSubtask = useToggleSubtask()

  const isActive = task.status === 'active'
  const isCompleted = task.status === 'completed'
  const isDeleted = task.status === 'deleted'
  const isRecurring = task.type === 'recurring'

  const isPending = softDelete.isPending || deleteTask.isPending || restoreTask.isPending

  const subtasks = task.subtasks ?? []
  const completedSubtasks = subtasks.filter((s) => s.done).length
  const hasSubtasks = subtasks.length > 0
  const subtaskProgress = hasSubtasks ? Math.round((completedSubtasks / subtasks.length) * 100) : 0

  const tags = (task.tags ?? []) as string[]

  return (
    <>
      {isEditing && (
        <div className="fixed inset-0 z-10 cursor-default" onClick={() => saveEdit(task.id)} />
      )}

      <div
        className={cn(
          'relative z-20 flex items-start space-x-4 p-4 rounded-xl border bg-background transition-all',
          isEditing ? 'ring-2 ring-primary shadow-md border-transparent' : 'hover:bg-accent/50',
          isDisabled ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100',
          isPending && 'opacity-50',
        )}
      >
        <div className="mt-1 shrink-0">
          <Checkbox
            id={`${task.id}`}
            checked={isCompleted}
            disabled={
              isUpdating || isDeleted || isEditing || isDisabled || (hasSubtasks && !isCompleted)
            }
            onCheckedChange={() => toggleStatus(task.id, task.status as 'active' | 'completed')}
          />
        </div>

        <div className="flex-1 min-w-0 grid gap-1.5 leading-none">
          {isEditing ? (
            <div className="space-y-2">
              <input
                autoFocus
                className="w-full bg-transparent text-base font-semibold outline-none border-b border-primary/30 focus:border-primary transition-colors"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                placeholder="Task title"
              />
              <textarea
                className="w-full bg-accent/30 p-2 rounded-md text-sm outline-none resize-none min-h-15"
                value={draft.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                placeholder="Add a description..."
              />
              <div className="flex space-x-2">
                <Button size="sm" className="h-7 px-2 text-xs" onClick={() => saveEdit(task.id)}>
                  <CheckIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={stopEditing}
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-0.5 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    isRecurring ? 'bg-violet-500' : 'bg-blue-500',
                  )}
                />
                <label
                  className={cn(
                    'text-base font-semibold transition-colors leading-snug',
                    isCompleted ? 'line-through text-muted-foreground/60' : 'text-foreground',
                  )}
                >
                  {task.title}
                </label>
                {isRecurring && !isCompleted && (
                  <RefreshCw className="h-3 w-3 shrink-0 text-violet-500/60" />
                )}
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground font-normal leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        TAG_STYLES[tag] ?? 'bg-muted text-muted-foreground',
                      )}
                    >
                      {TAG_LABELS[tag] ?? tag}
                    </span>
                  ))}
                </div>
              )}

              {hasSubtasks && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          subtaskProgress === 100 ? 'bg-emerald-500' : 'bg-violet-500',
                        )}
                        style={{ width: `${subtaskProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                      {completedSubtasks}/{subtasks.length}
                    </span>
                  </div>

                  {subtasks.map((subtask, index) => (
                    <div
                      key={subtask.id ?? index}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        id={`subtask-${task.id}-${index}`}
                        checked={subtask.done ?? false}
                        disabled={
                          isDeleted ||
                          isCompleted ||
                          (toggleSubtask.isPending &&
                            toggleSubtask.variables?.taskId === task.id &&
                            toggleSubtask.variables?.subtaskIndex === index)
                        }
                        onCheckedChange={() =>
                          toggleSubtask.mutate({ taskId: task.id, subtaskIndex: index })
                        }
                        className="h-3.5 w-3.5"
                      />
                      <label
                        htmlFor={`subtask-${task.id}-${index}`}
                        className={cn(
                          'text-sm cursor-pointer transition-colors',
                          subtask.done
                            ? 'line-through text-muted-foreground/50'
                            : 'text-muted-foreground',
                        )}
                      >
                        {subtask.title}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center self-start mt-0.5 space-x-1 shrink-0">
          {!isEditing && isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => startEditing(task)}
              disabled={isDisabled}
            >
              <PencilSquareIcon className="h-5 w-5" />
            </Button>
          )}

          {isDeleted ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-primary transition-transform hover:rotate-180"
                onClick={() => restoreTask.mutate(task.id)}
                disabled={isPending}
              >
                <ArrowPathIcon className="h-5 w-5" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    disabled={isPending}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{' '}
                      <strong>{task.title}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteTask.mutate(task.id)}
                      variant="destructive"
                    >
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              onClick={() => softDelete.mutate(task.id)}
              disabled={isDisabled || isPending}
            >
              <TrashIcon className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
