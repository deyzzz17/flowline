'use client'

import { Checkbox } from '../ui/checkbox'
import { useTask } from '@/hooks/tasks/use-task'
import { useSoftDelete } from '@/hooks/tasks/use-soft-delete'
import { useDeleteTask } from '@/hooks/tasks/use-delete-task'
import { useRestoreTask } from '@/hooks/tasks/use-restore-task'
import { useToggleSubtask } from '@/hooks/tasks/use-toggle-subtasks'
import { useDeleteSubtask } from '@/hooks/tasks/use-delete-subtask'
import type { Task } from '@/payload-types'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { TrashIcon, ArrowPathIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
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
import { RefreshCw, Plus, X, ChevronDown, ChevronUp, Tag, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { InlineDatePicker } from './inline-date-picker'
import { DueDateBadge } from './due-date-badge'
import { TaskTag } from '@/types/task-tag'
import { RecurrenceDay } from '@/types/recurrence-day'
import { EditSubtask } from '@/types/edit-subtask'
import { MentionTextarea } from './mention-textarea'
import { MentionRenderer } from './mention-renderer'
import { toast } from 'sonner'
import { format } from 'date-fns'

function hexToRgba(hex: string, alpha: number) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(139,92,246,${alpha})`
  }
}

function getDaysLeft(trashedAt: string): number {
  const diffMs = Date.now() - new Date(trashedAt).getTime()
  const daysUsed = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, 15 - daysUsed)
}

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
  { value: 'urgent', label: 'Urgent' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'health', label: 'Health' },
  { value: 'finance', label: 'Finance' },
  { value: 'learning', label: 'Learning' },
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
const DAY_FULL: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

interface TaskCardProps {
  task: Task
  isEditing?: boolean
  isDisabled?: boolean
  readOnly?: boolean
  noEdit?: boolean
  showListBadge?: boolean
  taskManager: ReturnType<typeof useTask>
}

export const TaskCard = ({
  task,
  isEditing,
  isDisabled,
  readOnly,
  noEdit,
  showListBadge,
  taskManager,
}: TaskCardProps) => {
  const {
    toggleStatus,
    isUpdating,
    startEditing,
    stopEditing,
    saveEdit,
    draft,
    updateDraft,
    editTags,
    setEditTags,
    editCustomTags,
    setEditCustomTags,
    editDays,
    setEditDays,
    editDueDate,
    setEditDueDate,
    editAutoDelete,
    setEditAutoDelete,
    editType,
    setEditType,
    editFrequency,
    setEditFrequency,
    editSubtasks,
    setEditSubtasks,
    subtaskInput,
    setSubtaskInput,
    expandedSubtask,
    setExpandedSubtask,
    expandedViewSubtask,
    setExpandedViewSubtask,
    showNewTag,
    setShowNewTag,
    newTagName,
    setNewTagName,
    newTagColor,
    setNewTagColor,
    editingSubtaskIndex,
    setEditingSubtaskIndex,
    subtaskEditDraft,
    setSubtaskEditDraft,
  } = taskManager

  const softDelete = useSoftDelete()
  const deleteTask = useDeleteTask()
  const restoreTask = useRestoreTask()
  const toggleSubtask = useToggleSubtask()
  const deleteSubtask = useDeleteSubtask()
  const queryClient = useQueryClient()

  const { data: userTagsData } = useQuery({
    queryKey: ['user-tags'],
    queryFn: () => api.tags.tags(),
  })
  const userTags = userTagsData?.docs ?? []

  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => api.tags.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-tags'] }),
  })

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => api.tags.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-tags'] })
      if (result.ok) toggleEditCustomTag(String(result.value.id))
    },
  })

  const isActive = task.status === 'active'
  const isCompleted = task.status === 'completed'
  const isDeleted = task.status === 'deleted'
  const isInactive = task.status === 'inactive'
  const isRecurring = task.type === 'recurring'
  const isPending = softDelete.isPending || deleteTask.isPending || restoreTask.isPending

  const subtasks = task.subtasks ?? []
  const completedSubtasks = subtasks.filter((s) => s.done).length
  const hasSubtasks = subtasks.length > 0
  const subtaskProgress = hasSubtasks ? Math.round((completedSubtasks / subtasks.length) * 100) : 0
  const tags = (task.tags ?? []) as string[]
  type UserTag = { id: number; name: string; color: string }
  const taskCustomTags = (task.customTags ?? []) as UserTag[]
  const recurrenceDays = (task.recurrence?.days ?? []) as string[]
  const isDaily = task.recurrence?.frequency === 'daily'
  const daysLeft = isDeleted && task.trashedAt ? getDaysLeft(task.trashedAt) : null

  type ListObj = { id: number; name: string; category?: { color?: string | null } | null }
  const taskList =
    showListBadge && task.list && typeof task.list === 'object' ? (task.list as ListObj) : null

  const handleStartEditing = () => {
    setEditTags((task.tags ?? []) as TaskTag[])
    setEditCustomTags(taskCustomTags.map((t) => String(t.id)))
    setEditDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
    setEditAutoDelete(task.autoDeleteOnDueDate ?? false)
    setEditType(task.type ?? 'simple')
    setEditFrequency((task.recurrence?.frequency as 'daily' | 'custom') ?? 'daily')
    setEditDays((task.recurrence?.days ?? []) as RecurrenceDay[])
    setEditSubtasks(
      (task.subtasks ?? []).map((s) => ({
        title: s.title,
        done: s.done ?? false,
        description: s.description ?? '',
        dueDate: s.dueDate ? new Date(s.dueDate) : undefined,
        tags: (s.tags ?? []) as string[],
      })),
    )
    setExpandedSubtask(null)
    setShowNewTag(false)
    setNewTagName('')
    setNewTagColor('#8b5cf6')
    startEditing(task)
  }

  const toggleEditTag = (tag: TaskTag) =>
    setEditTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  const toggleEditCustomTag = (tagId: string) =>
    setEditCustomTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )

  const toggleEditDay = (day: RecurrenceDay) =>
    setEditDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))

  const updateSubtask = (index: number, field: keyof EditSubtask, value: unknown) =>
    setEditSubtasks((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))

  const toggleSubtaskTag = (index: number, tag: string) => {
    const current = editSubtasks[index]?.tags ?? []
    updateSubtask(
      index,
      'tags',
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    )
  }

  const addEditSubtask = () => {
    if (!subtaskInput.trim()) return
    setEditSubtasks((prev) => [...prev, { title: subtaskInput.trim(), done: false }])
    setSubtaskInput('')
  }

  const removeEditSubtask = (i: number) => {
    setEditSubtasks((prev) => prev.filter((_, idx) => idx !== i))
    if (expandedSubtask === i) setExpandedSubtask(null)
    else if (expandedSubtask !== null && expandedSubtask > i)
      setExpandedSubtask(expandedSubtask - 1)
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    await createTagMutation.mutateAsync({ name: newTagName.trim(), color: newTagColor })
    setNewTagName('')
    setNewTagColor('#8b5cf6')
    setShowNewTag(false)
  }

  const handleSaveEdit = () => {
    saveEdit(task.id, {
      tags: editTags,
      customTags: editCustomTags.map((id) => parseInt(id)),
      dueDate: editDueDate ? editDueDate.toISOString() : null,
      autoDeleteOnDueDate: editAutoDelete,
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
          tags: (s.tags ?? []) as NonNullable<Task['subtasks']>[number]['tags'],
        })),
    })
  }

  return (
    <>
      {isEditing && <div className="fixed inset-0 z-10 cursor-default" onClick={handleSaveEdit} />}

      <div
        data-task-id={task.id}
        className={cn(
          'relative z-20 flex items-start gap-2 p-3 sm:gap-3 sm:p-4 rounded-xl border bg-background transition-all',
          isEditing ? 'ring-2 ring-primary shadow-md border-transparent' : 'hover:bg-accent/50',
          isDisabled ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100',
          isInactive && !isEditing && 'opacity-60',
          isPending && 'opacity-50',
        )}
      >
        <div className="mt-1 shrink-0">
          <Checkbox
            id={`${task.id}`}
            checked={isCompleted}
            disabled={
              isUpdating ||
              isDeleted ||
              isEditing ||
              isDisabled ||
              isInactive ||
              (hasSubtasks && !isCompleted)
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

              <MentionTextarea
                value={draft.description}
                onChange={(v) => updateDraft({ description: v })}
                placeholder="Add a description..."
                minHeight="min-h-[72px]"
              />

              <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Due date
                </p>
                <InlineDatePicker value={editDueDate} onChange={setEditDueDate} />
                {editDueDate && (
                  <button
                    type="button"
                    onClick={() => setEditAutoDelete(!editAutoDelete)}
                    className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3 transition-all hover:bg-muted/40"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Auto-delete on due date</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Move to trash automatically when the due date passes
                      </p>
                    </div>
                    <div
                      className={cn(
                        'relative ml-4 h-5 w-9 shrink-0 rounded-full transition-colors',
                        editAutoDelete ? 'bg-violet-500' : 'bg-muted-foreground/30',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                          editAutoDelete ? 'translate-x-4' : 'translate-x-0',
                        )}
                      />
                    </div>
                  </button>
                )}
              </div>

              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
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
                {userTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {userTags.map((tag) => {
                      const isSelected = editCustomTags.includes(String(tag.id))
                      return (
                        <div key={tag.id} className="flex items-center group">
                          <button
                            type="button"
                            onClick={() => toggleEditCustomTag(String(tag.id))}
                            className={cn(
                              'flex items-center gap-1.5 rounded-l-full border-y border-l px-2.5 py-1 text-xs font-medium transition-all',
                              isSelected
                                ? ''
                                : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                            )}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: hexToRgba(tag.color, 0.15),
                                    borderColor: hexToRgba(tag.color, 0.5),
                                    color: tag.color,
                                  }
                                : undefined
                            }
                          >
                            {tag.name}
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                className="flex items-center justify-center h-full rounded-r-full border-y border-r px-1.5 py-1 opacity-100"
                                style={
                                  isSelected
                                    ? {
                                        backgroundColor: hexToRgba(tag.color, 0.15),
                                        borderColor: hexToRgba(tag.color, 0.5),
                                        color: tag.color,
                                      }
                                    : undefined
                                }
                                onClick={(e) => e.stopPropagation()}
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this tag?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the tag <strong>{tag.name}</strong>{' '}
                                  and remove it from all tasks.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    deleteTagMutation.mutate(tag.id)
                                    setEditCustomTags((prev) =>
                                      prev.filter((id) => id !== String(tag.id)),
                                    )
                                  }}
                                  variant="destructive"
                                >
                                  Delete tag
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )
                    })}
                  </div>
                )}
                {showNewTag ? (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">New tag</p>
                      <button
                        type="button"
                        onClick={() => setShowNewTag(false)}
                        className="text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Tag name..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCreateTag()
                        }
                      }}
                    />
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Color
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className="h-9 w-9 rounded-lg border border-border/60 cursor-pointer overflow-hidden"
                            style={{ backgroundColor: newTagColor }}
                          />
                          <input
                            type="color"
                            value={newTagColor}
                            onChange={(e) => setNewTagColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        <div className="flex-1 flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 h-9">
                          <span
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: newTagColor }}
                          />
                          <span className="text-xs font-mono text-muted-foreground flex-1">
                            {newTagColor}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shrink-0"
                          style={{
                            backgroundColor: hexToRgba(newTagColor, 0.12),
                            borderColor: hexToRgba(newTagColor, 0.35),
                            color: newTagColor,
                          }}
                        >
                          {newTagName || 'Preview'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim() || createTagMutation.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-all hover:bg-foreground/80 disabled:opacity-40"
                    >
                      {createTagMutation.isPending ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" />
                          Create tag
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewTag(true)}
                    className="flex items-center gap-1.5 rounded-full border border-dashed border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-all hover:border-border hover:text-foreground"
                  >
                    <Tag className="h-3 w-3" />
                    New tag
                  </button>
                )}
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
                    {editSubtasks.map((s, i) => {
                      const isExpanded = expandedSubtask === i
                      const hasDetails = s.description || s.dueDate || (s.tags?.length ?? 0) > 0
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-border/50 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                            <Checkbox checked={s.done} disabled className="h-3.5 w-3.5 shrink-0" />
                            <input
                              value={s.title}
                              onChange={(e) => updateSubtask(i, 'title', e.target.value)}
                              placeholder="Subtask title..."
                              className={cn(
                                'flex-1 bg-transparent text-xs outline-none border-b border-transparent focus:border-primary/30 transition-colors py-0.5',
                                s.done
                                  ? 'line-through text-muted-foreground/50'
                                  : 'text-foreground',
                              )}
                            />
                            {hasDetails && !isExpanded && (
                              <Tag className="h-2.5 w-2.5 shrink-0 text-violet-500/60" />
                            )}
                            <button
                              type="button"
                              onClick={() => setExpandedSubtask(isExpanded ? null : i)}
                              className="text-muted-foreground/40 hover:text-foreground transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEditSubtask(i)}
                              className="text-muted-foreground/40 hover:text-destructive transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="px-3 pb-3 pt-2.5 space-y-3.5 border-t border-border/40 bg-background/60">
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                  Description{' '}
                                  <span className="normal-case font-normal">Optional</span>
                                </p>
                                <Textarea
                                  value={s.description ?? ''}
                                  onChange={(e) => updateSubtask(i, 'description', e.target.value)}
                                  placeholder="Add details..."
                                  className="h-16 resize-none text-xs"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                  Due date <span className="normal-case font-normal">Optional</span>
                                </p>
                                <InlineDatePicker
                                  value={editDueDate}
                                  onChange={(d) => {
                                    setEditDueDate(d)
                                    if (d)
                                      toast.info('Parent due date updated', {
                                        description: `Due date set to ${format(d, 'PPP')}.`,
                                      })
                                  }}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                  Tags <span className="normal-case font-normal">Optional</span>
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {TAG_OPTIONS.map((tag) => (
                                    <button
                                      key={tag.value}
                                      type="button"
                                      onClick={() => toggleSubtaskTag(i, tag.value)}
                                      className={cn(
                                        'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all',
                                        (s.tags ?? []).includes(tag.value)
                                          ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                          : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                                      )}
                                    >
                                      {tag.label}
                                    </button>
                                  ))}
                                  {userTags.map((tag) => {
                                    const isSelected = (s.tags ?? []).includes(String(tag.id))
                                    return (
                                      <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleSubtaskTag(i, String(tag.id))}
                                        className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all"
                                        style={{
                                          backgroundColor: hexToRgba(
                                            tag.color,
                                            isSelected ? 0.15 : 0.06,
                                          ),
                                          borderColor: hexToRgba(tag.color, isSelected ? 0.5 : 0.2),
                                          color: tag.color,
                                        }}
                                      >
                                        <span
                                          className="h-1.5 w-1.5 rounded-full shrink-0"
                                          style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-xs text-muted-foreground"
                  onClick={stopEditing}
                >
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
                    isInactive
                      ? 'bg-muted-foreground/40'
                      : isRecurring
                        ? 'bg-violet-500'
                        : 'bg-blue-500',
                  )}
                />
                <label
                  className={cn(
                    'text-base font-semibold transition-colors leading-snug min-w-0',
                    isCompleted
                      ? 'line-through text-muted-foreground/60'
                      : isInactive
                        ? 'text-muted-foreground'
                        : 'text-foreground',
                  )}
                >
                  {task.title}
                </label>
                {isRecurring && !isCompleted && (
                  <RefreshCw
                    className={cn(
                      'h-3 w-3 shrink-0',
                      isInactive ? 'text-muted-foreground/40' : 'text-violet-500/60',
                    )}
                  />
                )}
              </div>

              {isRecurring && (
                <div className="flex items-center gap-1.5">
                  {isDaily ? (
                    <span className="text-[10px] font-medium text-muted-foreground/60">
                      Every day
                    </span>
                  ) : recurrenceDays.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {DAY_OPTIONS.map((day) => (
                        <span
                          key={day.value}
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                            recurrenceDays.includes(day.value)
                              ? isInactive
                                ? 'bg-muted-foreground/10 text-muted-foreground/60'
                                : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                              : 'text-muted-foreground/20',
                          )}
                        >
                          {DAY_FULL[day.value]}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {task.description && (
                <MentionRenderer
                  text={task.description}
                  currentListSlug={
                    task.list && typeof task.list === 'object'
                      ? (task.list as { slug: string }).slug
                      : undefined
                  }
                />
              )}

              {(tags.length > 0 ||
                task.dueDate ||
                taskCustomTags.length > 0 ||
                daysLeft !== null) && (
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
                  {taskCustomTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: hexToRgba(tag.color, 0.12),
                        color: tag.color,
                        border: `1px solid ${hexToRgba(tag.color, 0.3)}`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </span>
                  ))}
                  {daysLeft !== null && (
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        daysLeft === 0
                          ? 'bg-destructive/15 text-destructive'
                          : daysLeft <= 2
                            ? 'bg-destructive/10 text-destructive'
                            : daysLeft <= 5
                              ? 'bg-orange-500/10 text-orange-500 dark:text-orange-400'
                              : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {daysLeft === 0 ? 'Deletes today' : `${daysLeft}d left`}
                    </span>
                  )}
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
                  {subtasks.map((subtask, index) => {
                    const subtaskTags = (subtask.tags ?? []) as string[]
                    const hasSubtaskDetails =
                      subtask.description || subtask.dueDate || subtaskTags.length > 0
                    const isViewExpanded = expandedViewSubtask === index
                    const isEditingThisSubtask = editingSubtaskIndex === index

                    const handleStartSubtaskEdit = () => {
                      setSubtaskEditDraft({
                        title: subtask.title,
                        description: subtask.description ?? '',
                        dueDate: subtask.dueDate ? new Date(subtask.dueDate) : undefined,
                        tags: subtaskTags,
                      })
                      setEditingSubtaskIndex(index)
                      setExpandedViewSubtask(null)
                    }

                    const handleSaveSubtaskEdit = async () => {
                      const updatedSubtasks = subtasks.map((s, i) =>
                        i === index
                          ? {
                              ...s,
                              title: subtaskEditDraft.title.trim() || s.title,
                              description: subtaskEditDraft.description,
                              dueDate: subtaskEditDraft.dueDate?.toISOString() ?? null,
                              tags: subtaskEditDraft.tags as NonNullable<
                                Task['subtasks']
                              >[number]['tags'],
                            }
                          : s,
                      )
                      await api.tasks.edit(task.id, {
                        subtasks: updatedSubtasks.map((s) => ({
                          title: s.title,
                          done: s.done ?? false,
                          description: s.description ?? '',
                          dueDate: s.dueDate ?? null,
                          tags: (s.tags ?? []) as NonNullable<Task['subtasks']>[number]['tags'],
                        })),
                      })
                      queryClient.invalidateQueries({ queryKey: ['tasks'] })
                      setEditingSubtaskIndex(null)
                    }
                    return (
                      <div
                        key={subtask.id ?? index}
                        className="rounded-lg border border-border/30 overflow-hidden"
                      >
                        {isEditingThisSubtask ? (
                          <div
                            className="px-3 py-2.5 space-y-2.5 bg-muted/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              autoFocus
                              value={subtaskEditDraft.title}
                              onChange={(e) =>
                                setSubtaskEditDraft((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              className="w-full bg-transparent text-sm font-medium outline-none border-b border-primary/30 focus:border-primary transition-colors pb-0.5"
                              placeholder="Subtask title"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSubtaskEdit()
                              }}
                            />
                            <MentionTextarea
                              value={subtaskEditDraft.description}
                              onChange={(v) =>
                                setSubtaskEditDraft((prev) => ({ ...prev, description: v }))
                              }
                              placeholder="Description..."
                              minHeight="min-h-[56px]"
                            />
                            <InlineDatePicker
                              value={subtaskEditDraft.dueDate}
                              onChange={(d) => {
                                setSubtaskEditDraft((prev) => ({ ...prev, dueDate: d }))
                                if (d)
                                  toast.info('Subtask due date updated', {
                                    description: `Due date set to ${format(d, 'PPP')}.`,
                                  })
                              }}
                            />
                            <div className="flex flex-wrap gap-1">
                              {TAG_OPTIONS.map((tag) => (
                                <button
                                  key={tag.value}
                                  type="button"
                                  onClick={() =>
                                    setSubtaskEditDraft((prev) => ({
                                      ...prev,
                                      tags: prev.tags.includes(tag.value)
                                        ? prev.tags.filter((t) => t !== tag.value)
                                        : [...prev.tags, tag.value],
                                    }))
                                  }
                                  className={cn(
                                    'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all',
                                    subtaskEditDraft.tags.includes(tag.value)
                                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                                  )}
                                >
                                  {tag.label}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-0.5">
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={handleSaveSubtaskEdit}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-3 text-xs text-muted-foreground"
                                onClick={() => setEditingSubtaskIndex(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/20 transition-colors">
                              <Checkbox
                                id={`subtask-${task.id}-${index}`}
                                checked={subtask.done ?? false}
                                disabled={
                                  isDeleted ||
                                  isCompleted ||
                                  isInactive ||
                                  (toggleSubtask.isPending &&
                                    toggleSubtask.variables?.taskId === task.id &&
                                    toggleSubtask.variables?.subtaskIndex === index)
                                }
                                onCheckedChange={() =>
                                  toggleSubtask.mutate({ taskId: task.id, subtaskIndex: index })
                                }
                                className="h-3.5 w-3.5 shrink-0"
                              />
                              <label
                                htmlFor={`subtask-${task.id}-${index}`}
                                className={cn(
                                  'flex-1 text-sm cursor-pointer transition-colors',
                                  subtask.done
                                    ? 'line-through text-muted-foreground/50'
                                    : 'text-muted-foreground',
                                )}
                              >
                                {subtask.title}
                              </label>
                              {hasSubtaskDetails && !isViewExpanded && (
                                <Tag className="h-2.5 w-2.5 shrink-0 text-violet-500/50" />
                              )}
                              {hasSubtaskDetails && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedViewSubtask(isViewExpanded ? null : index)
                                  }
                                  className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                                >
                                  {isViewExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                              {!isDeleted && !isCompleted && (
                                <button
                                  type="button"
                                  className="text-muted-foreground/30 hover:text-primary transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartSubtaskEdit()
                                  }}
                                >
                                  <PencilSquareIcon className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {!isDeleted && !isCompleted && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-muted-foreground/30 hover:text-destructive transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <TrashIcon className="h-3.5 w-3.5" />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete this subtask?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete{' '}
                                        <strong>{subtask.title}</strong>.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          deleteSubtask.mutate({
                                            taskId: task.id,
                                            subtaskIndex: index,
                                          })
                                        }
                                        variant="destructive"
                                      >
                                        Delete permanently
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                            {isViewExpanded && (
                              <div className="px-3 pb-2.5 pt-1.5 space-y-1.5 border-t border-border/30 bg-muted/10">
                                {subtask.description && (
                                  <MentionRenderer
                                    text={subtask.description}
                                    currentListSlug={
                                      task.list && typeof task.list === 'object'
                                        ? (task.list as { slug: string }).slug
                                        : undefined
                                    }
                                  />
                                )}
                                {(subtask.dueDate || subtaskTags.length > 0) && (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {subtask.dueDate && (
                                      <DueDateBadge
                                        dateString={subtask.dueDate}
                                        completed={subtask.done ?? false}
                                      />
                                    )}
                                    {subtaskTags.map((tag) => (
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
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {!isEditing && taskList && (
          <span
            className="inline-flex items-center self-start mt-1 gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
            style={{
              backgroundColor: hexToRgba(taskList.category?.color ?? '#8b5cf6', 0.1),
              color: taskList.category?.color ?? '#8b5cf6',
              border: `1px solid ${hexToRgba(taskList.category?.color ?? '#8b5cf6', 0.25)}`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: taskList.category?.color ?? '#8b5cf6' }}
            />
            {taskList.name}
          </span>
        )}

        {!isEditing && !readOnly && (
          <div className="flex items-center self-start gap-1 shrink-0 mt-0.5">
            {(isActive || isInactive) && !noEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary"
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
                  className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary hover:rotate-180 transition-transform"
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
