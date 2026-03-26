'use client'

import { useState } from 'react'
import { Checkbox } from '../ui/checkbox'
import { useTask } from '@/hooks/tasks/use-task'
import { useSoftDelete } from '@/hooks/tasks/use-soft-delete'
import { useDeleteTask } from '@/hooks/tasks/use-delete-task'
import { useRestoreTask } from '@/hooks/tasks/use-restore-task'
import { useToggleSubtask } from '@/hooks/tasks/use-toggle-subtasks'
import type { Task } from '@/payload-types'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
import { RefreshCw, CalendarIcon, Plus, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isPast, isToday, isTomorrow } from 'date-fns'

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

const TAG_OPTIONS = [
  { value: 'urgent', label: '🔴 Urgent' },
  { value: 'work', label: '💼 Work' },
  { value: 'personal', label: '🙂 Personal' },
  { value: 'health', label: '💪 Health' },
  { value: 'finance', label: '💰 Finance' },
  { value: 'learning', label: '📚 Learning' },
]

const DAY_OPTIONS = [
  { value: 'mon', label: 'Mo' },
  { value: 'tue', label: 'Tu' },
  { value: 'wed', label: 'We' },
  { value: 'thu', label: 'Th' },
  { value: 'fri', label: 'Fr' },
  { value: 'sat', label: 'Sa' },
  { value: 'sun', label: 'Su' },
]

type TaskTag = NonNullable<Task['tags']>[number]
type RecurrenceDay = NonNullable<NonNullable<Task['recurrence']>['days']>[number]
type EditSubtask = {
  title: string
  done: boolean
  description?: string
  dueDate?: Date
  tags?: string[]
}

function DueDateBadge({ dateString, completed }: { dateString: string; completed: boolean }) {
  const date = new Date(dateString)
  const overdue = !completed && isPast(date) && !isToday(date)
  const dueToday = isToday(date)
  const dueTomorrow = isTomorrow(date)
  const label = dueToday ? 'Today' : dueTomorrow ? 'Tomorrow' : format(date, 'MMM d')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
        overdue
          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
          : dueToday
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            : 'bg-muted text-muted-foreground',
      )}
    >
      {overdue && <AlertCircle className="h-2.5 w-2.5" />}
      <CalendarIcon className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}

function InlineDatePicker({
  value,
  onChange,
}: {
  value: Date | undefined
  onChange: (d: Date | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-lg border border-border/60 bg-background px-3 text-xs transition-all hover:bg-muted',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left">{value ? format(value, 'PPP') : 'No due date'}</span>
          {value && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
              }}
              className="text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d)
            setOpen(false)
          }}
          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
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

  const [editTags, setEditTags] = useState<TaskTag[]>([])
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined)
  const [editType, setEditType] = useState<Task['type']>('simple')
  const [editFrequency, setEditFrequency] = useState<'daily' | 'custom'>('daily')
  const [editDays, setEditDays] = useState<RecurrenceDay[]>([])
  const [editSubtasks, setEditSubtasks] = useState<EditSubtask[]>([])
  const [subtaskInput, setSubtaskInput] = useState('')

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

  const handleStartEditing = () => {
    setEditTags((task.tags ?? []) as TaskTag[])
    setEditDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
    setEditType(task.type ?? 'simple')
    setEditFrequency((task.recurrence?.frequency as 'daily' | 'custom') ?? 'daily')
    setEditDays((task.recurrence?.days ?? []) as RecurrenceDay[])
    setEditSubtasks((task.subtasks ?? []).map((s) => ({ title: s.title, done: s.done ?? false })))
    startEditing(task)
  }

  const toggleEditTag = (tag: TaskTag) => {
    setEditTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const toggleEditDay = (day: RecurrenceDay) => {
    setEditDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const updateSubtaskTitle = (index: number, title: string) => {
    setEditSubtasks((prev) => prev.map((s, i) => (i === index ? { ...s, title } : s)))
  }

  const addEditSubtask = () => {
    if (!subtaskInput.trim()) return
    setEditSubtasks((prev) => [...prev, { title: subtaskInput.trim(), done: false }])
    setSubtaskInput('')
  }

  const removeEditSubtask = (i: number) => {
    setEditSubtasks((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSaveEdit = () => {
    saveEdit(task.id, {
      tags: editTags,
      dueDate: editDueDate ? editDueDate.toISOString() : null,
      type: editType,
      recurrence:
        editType === 'recurring'
          ? { frequency: editFrequency, ...(editFrequency === 'custom' && { days: editDays }) }
          : undefined,
      subtasks: editSubtasks
        .filter((s) => s.title.trim() !== '')
        .map((s) => ({
          title: s.title,
          done: s.done,
          description: s.description ?? '',
          dueDate: s.dueDate ? s.dueDate.toISOString() : null,
          tags: s.tags ?? [],
        })),
    })
  }

  return (
    <>
      {isEditing && <div className="fixed inset-0 z-10 cursor-default" onClick={handleSaveEdit} />}

      <div
        className={cn(
          'relative z-20 flex items-start gap-3 p-4 rounded-xl border bg-background transition-all',
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

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditType('simple')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all',
                    editType === 'simple'
                      ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => setEditType('recurring')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all',
                    editType === 'recurring'
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  <RefreshCw className="h-3 w-3" />
                  Recurring
                </button>
              </div>

              <input
                autoFocus
                className="w-full bg-transparent text-base font-semibold outline-none border-b border-primary/30 focus:border-primary transition-colors pb-1"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                placeholder="Task title"
              />

              <textarea
                className="w-full bg-muted/30 p-3 rounded-xl text-sm outline-none resize-none min-h-18 border border-border/40 focus:border-primary/30 transition-colors"
                value={draft.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                placeholder="Add a description..."
              />

              {editType === 'simple' && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Due date
                  </p>
                  <InlineDatePicker value={editDueDate} onChange={setEditDueDate} />
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => toggleEditTag(tag.value as TaskTag)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                        editTags.includes(tag.value as TaskTag)
                          ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                          : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {editType === 'recurring' && (
                <div className="space-y-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    Recurrence
                  </p>
                  <div className="flex gap-2">
                    {['daily', 'custom'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setEditFrequency(f as 'daily' | 'custom')}
                        className={cn(
                          'flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all',
                          editFrequency === f
                            ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                            : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {f === 'daily' ? 'Every day' : 'Custom days'}
                      </button>
                    ))}
                  </div>
                  {editFrequency === 'custom' && (
                    <div className="flex gap-1">
                      {DAY_OPTIONS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleEditDay(day.value as RecurrenceDay)}
                          className={cn(
                            'flex-1 rounded-lg border py-1.5 text-[11px] font-semibold transition-all',
                            editDays.includes(day.value as RecurrenceDay)
                              ? 'border-violet-500/40 bg-violet-500/15 text-violet-600 dark:text-violet-400'
                              : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                          )}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Subtasks
                </p>

                {editSubtasks.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {editSubtasks.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-1.5 group"
                      >
                        <Checkbox checked={s.done} disabled className="h-3.5 w-3.5 shrink-0" />
                        <input
                          value={s.title}
                          onChange={(e) => updateSubtaskTitle(i, e.target.value)}
                          placeholder="Subtask title..."
                          className={cn(
                            'flex-1 bg-transparent text-xs outline-none transition-colors',
                            s.done ? 'line-through text-muted-foreground/50' : 'text-foreground',
                            'border-b border-transparent focus:border-primary/30',
                          )}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          type="button"
                          onClick={() => removeEditSubtask(i)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addEditSubtask()
                      }
                    }}
                    placeholder="Add a subtask..."
                    className="flex-1 h-8 rounded-lg border border-border/60 bg-background px-3 text-xs outline-none focus:border-primary/40 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    onClick={addEditSubtask}
                    disabled={!subtaskInput.trim()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-all hover:bg-muted disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" className="h-8 px-3 text-xs gap-1.5" onClick={handleSaveEdit}>
                  <CheckIcon className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-xs text-muted-foreground"
                  onClick={stopEditing}
                >
                  <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-0.5">
              <div className="flex items-center gap-2 flex-wrap">
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
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              )}

              {(tags.length > 0 || task.dueDate) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {task.dueDate && (
                    <DueDateBadge dateString={task.dueDate} completed={isCompleted} />
                  )}
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
                <div className="space-y-1.5 pt-0.5">
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

        {!isEditing && (
          <div className="flex items-center self-start gap-0.5 shrink-0">
            {isActive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={handleStartEditing}
                disabled={isDisabled}
              >
                <PencilSquareIcon className="h-4 w-4" />
              </Button>
            )}
            {isDeleted ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:rotate-180 transition-transform"
                  onClick={() => restoreTask.mutate(task.id)}
                  disabled={isPending}
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                      disabled={isPending}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete <strong>{task.title}</strong>.
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
                className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                onClick={() => softDelete.mutate(task.id)}
                disabled={isDisabled || isPending}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
