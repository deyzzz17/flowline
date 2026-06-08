'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PlusIcon } from '@heroicons/react/24/outline'
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
import { Plus, RefreshCw, ChevronDown, ChevronUp, Tag, Check, Loader2, X } from 'lucide-react'
import { useManageForm } from '@/hooks/tasks/use-manage-form'
import { useTaskCreation } from '@/hooks/tasks/use-task-creation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { DatePicker } from './date-picker'
import { FormField } from './form-field'
import { MentionTextarea } from './mention-textarea'
import { toast } from 'sonner'
import { format } from 'date-fns'

const TAG_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'health', label: 'Health' },
  { value: 'finance', label: 'Finance' },
  { value: 'learning', label: 'Learning' },
] as const

const DAY_OPTIONS = [
  { value: 'mon', label: 'Mo' },
  { value: 'tue', label: 'Tu' },
  { value: 'wed', label: 'We' },
  { value: 'thu', label: 'Th' },
  { value: 'fri', label: 'Fr' },
  { value: 'sat', label: 'Sa' },
  { value: 'sun', label: 'Su' },
] as const

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

interface CreateTaskProps {
  listId?: number
}

export const CreateTask = ({ listId }: CreateTaskProps) => {
  const { isOpen, close, setIsOpen } = useManageForm()
  const {
    title,
    description,
    setTitle,
    setDescription,
    showError,
    isLoading,
    saveTask,
    type,
    setType,
    tags,
    toggleTag,
    customTags,
    toggleCustomTag,
    subtasks,
    addSubtask,
    removeSubtask,
    updateSubtaskDetail,
    toggleSubtaskTag,
    frequency,
    setFrequency,
    days,
    toggleDay,
    dueDate,
    setDueDate,
    autoDeleteOnDueDate,
    setAutoDeleteOnDueDate,
    resetForm,
    showNewTag,
    setShowNewTag,
    newTagName,
    setNewTagName,
    newTagColor,
    setNewTagColor,
    subtaskInput,
    setSubtaskInput,
    expandedIndex,
    setExpandedIndex,
  } = useTaskCreation()

  const queryClient = useQueryClient()

  const titleRef = React.useRef<HTMLInputElement>(null)

  const { data: userTagsData } = useQuery({
    queryKey: ['user-tags'],
    queryFn: () => api.tags.tags(),
  })
  const userTags = userTagsData?.docs ?? []

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => api.tags.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-tags'] })
      if (result.ok) toggleCustomTag(String(result.value.id))
    },
  })

  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => api.tags.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['user-tags'] })
      const previous = queryClient.getQueryData(['user-tags'])
      queryClient.setQueryData<{ docs: any[] }>(['user-tags'], (old) => {
        if (!old) return old
        return { ...old, docs: old.docs.filter((t) => t.id !== id) }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['user-tags'], context?.previous)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-tags'] }),
  })

  const isRecurring = type === 'recurring'

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    await createTagMutation.mutateAsync({ name: newTagName.trim(), color: newTagColor })
    setNewTagName('')
    setNewTagColor('#8b5cf6')
    setShowNewTag(false)
  }

  const handleSetDueDate = (d: Date | undefined) => {
    if (d) {
      const conflicting = subtasks.find((s) => s.dueDate && s.dueDate > d)
      if (conflicting) {
        toast.error('Due date conflict', {
          description: `The parent task's due date cannot be before a subtask's due date (${format(conflicting.dueDate!, 'PPP')}).`,
        })
        return
      }
    }
    setDueDate(d)
  }

  const handleSetSubtaskDueDate = (index: number, d: Date | undefined) => {
    if (d && dueDate && d > dueDate) {
      toast.error('Due date conflict', {
        description: `A subtask cannot have a due date after the parent task's due date (${format(dueDate, 'PPP')}).`,
      })
      return
    }
    updateSubtaskDetail(index, 'dueDate', d)
  }

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      titleRef.current?.focus()
      return
    }
    setSubtaskInput('')
    setExpandedIndex(null)
    setShowNewTag(false)
    close()

    await saveTask(listId)
  }

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return
    addSubtask(subtaskInput)
    setSubtaskInput('')
  }

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSubtask()
    }
  }

  const handleRemoveSubtask = (index: number) => {
    removeSubtask(index)
    if (expandedIndex === index) setExpandedIndex(null)
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1)
  }

  const handleClose = () => {
    resetForm()
    setSubtaskInput('')
    setExpandedIndex(null)
    setShowNewTag(false)
    setNewTagName('')
    setNewTagColor('#8b5cf6')
    close()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
        else setIsOpen(true)
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full max-w-48 justify-between h-12 px-5 shadow-sm group"
        >
          <span className="font-medium text-muted-foreground group-hover:text-foreground">
            Add a new task
          </span>
          <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors ml-4">
            <PlusIcon className="size-4" strokeWidth={3} />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] my-4 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleOnSubmit} className="space-y-6 pt-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('simple')}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                type === 'simple'
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Simple
            </button>
            <button
              type="button"
              onClick={() => setType('recurring')}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                type === 'recurring'
                  ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                  : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              <RefreshCw className="h-3 w-3" />
              Recurring
            </button>
          </div>

          <FormField label="Title" error={showError ? 'Title is required' : undefined}>
            <Input
              ref={titleRef}
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={cn(
                'h-11 transition-all',
                showError && 'border-destructive focus-visible:ring-destructive bg-destructive/5',
              )}
            />
          </FormField>

          <FormField label="Description" optional>
            <MentionTextarea
              value={description}
              onChange={setDescription}
              placeholder="Add more details..."
              minHeight="min-h-[96px]"
            />
          </FormField>

          <FormField label="Due date" optional>
            <div className="space-y-2.5">
              <DatePicker value={dueDate} onChange={handleSetDueDate} />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setAutoDeleteOnDueDate(!autoDeleteOnDueDate)}
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
                      autoDeleteOnDueDate ? 'bg-violet-500' : 'bg-muted-foreground/30',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                        autoDeleteOnDueDate ? 'translate-x-4' : 'translate-x-0',
                      )}
                    />
                  </div>
                </button>
              )}
            </div>
          </FormField>

          <FormField label="Tags" optional>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleTag(tag.value as never)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                      (tags as string[]).includes(tag.value)
                        ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {userTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {userTags.map((tag) => {
                    const isSelected = customTags.includes(String(tag.id))
                    return (
                      <div key={tag.id} className="flex items-center group">
                        <button
                          type="button"
                          onClick={() => toggleCustomTag(String(tag.id))}
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
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this tag?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the tag <strong>{tag.name}</strong> and
                                remove it from all tasks. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTagMutation.mutate(tag.id)}
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
          </FormField>

          <FormField label="Subtasks" optional>
            <div className="space-y-2">
              {subtasks.length > 0 && (
                <div className="space-y-1.5">
                  {subtasks.map((s, index) => {
                    const isExpanded = expandedIndex === index
                    const hasDetails = s.description || s.dueDate || (s.tags?.length ?? 0) > 0
                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-border/50 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                          <span className="flex-1 text-sm text-foreground">{s.title}</span>
                          {hasDetails && !isExpanded && (
                            <Tag className="h-2.5 w-2.5 shrink-0 text-violet-500/60" />
                          )}
                          <button
                            type="button"
                            onClick={() => setExpandedIndex(isExpanded ? null : index)}
                            className="text-muted-foreground/50 hover:text-foreground transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(index)}
                            className="text-muted-foreground/50 hover:text-destructive transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-3 space-y-5 border-t border-border/40 bg-background/50">
                            <div className="space-y-3">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Description{' '}
                                <span className="normal-case font-normal">Optional</span>
                              </label>
                              <MentionTextarea
                                value={s.description ?? ''}
                                onChange={(v) => updateSubtaskDetail(index, 'description', v)}
                                placeholder="Add details to this subtask..."
                                minHeight="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Due date <span className="normal-case font-normal">Optional</span>
                              </label>
                              <div className="mt-1">
                                <DatePicker
                                  value={s.dueDate}
                                  onChange={(d) => handleSetSubtaskDueDate(index, d)}
                                />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Tags <span className="normal-case font-normal">Optional</span>
                              </label>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {TAG_OPTIONS.map((tag) => (
                                  <button
                                    key={tag.value}
                                    type="button"
                                    onClick={() => toggleSubtaskTag(index, tag.value)}
                                    className={cn(
                                      'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                                      (s.tags ?? []).includes(tag.value)
                                        ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                  >
                                    {tag.label}
                                  </button>
                                ))}
                                {userTags.length > 0 &&
                                  userTags.map((tag) => {
                                    const isSelected = (s.tags ?? []).includes(String(tag.id))
                                    return (
                                      <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleSubtaskTag(index, String(tag.id))}
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
              <div className="flex gap-2">
                <Input
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                  placeholder="Add a subtask..."
                  className="h-10 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={!subtaskInput.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </FormField>

          {isRecurring && (
            <div className="space-y-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Recurrence
              </p>
              <div className="flex gap-2">
                {['daily', 'custom'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f as never)}
                    className={cn(
                      'flex-1 rounded-lg border py-2.5 text-xs font-medium transition-all',
                      frequency === f
                        ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {f === 'daily' ? 'Every day' : 'Custom days'}
                  </button>
                ))}
              </div>
              {frequency === 'custom' && (
                <div className="flex gap-1.5">
                  {DAY_OPTIONS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value as never)}
                      className={cn(
                        'flex-1 rounded-lg border py-2 text-xs font-semibold transition-all',
                        days.includes(day.value as never)
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

          <DialogFooter className="flex-row gap-2 sm:justify-end pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button disabled={isLoading} className="bg-primary px-8">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
