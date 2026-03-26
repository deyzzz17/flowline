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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PlusIcon } from '@heroicons/react/24/outline'
import {
  AlertCircleIcon,
  Plus,
  X,
  RefreshCw,
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react'
import { format } from 'date-fns'
import { useManageForm } from '@/hooks/tasks/use-manage-form'
import { useTaskCreation } from '@/hooks/tasks/use-task-creation'

const TAG_OPTIONS = [
  { value: 'urgent', label: '🔴 Urgent' },
  { value: 'work', label: '💼 Work' },
  { value: 'personal', label: '🙂 Personal' },
  { value: 'health', label: '💪 Health' },
  { value: 'finance', label: '💰 Finance' },
  { value: 'learning', label: '📚 Learning' },
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

type SubtaskDetail = {
  title: string
  done: boolean
  description?: string
  dueDate?: Date
  tags?: string[]
}

const FormField = ({
  label,
  optional,
  error,
  children,
}: {
  label: string
  optional?: boolean
  error?: string
  children: React.ReactNode
}) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-foreground">
        {label}
        {optional && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span>
        )}
      </label>
      {error && (
        <p className="flex items-center gap-1 text-xs font-semibold text-destructive animate-in fade-in slide-in-from-right-1">
          <AlertCircleIcon size={12} />
          {error}
        </p>
      )}
    </div>
    {children}
  </div>
)

const DatePicker = ({
  value,
  onChange,
}: {
  value: Date | undefined
  onChange: (d: Date | undefined) => void
}) => {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center gap-2.5 rounded-xl border border-border/60 bg-background px-3 text-sm transition-all hover:bg-muted',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left">{value ? format(value, 'PPP') : 'Pick a date'}</span>
          {value && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
              }}
              className="text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
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

const TagPicker = ({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (tag: string) => void
}) => (
  <div className="flex flex-wrap gap-1.5">
    {TAG_OPTIONS.map((tag) => (
      <button
        key={tag.value}
        type="button"
        onClick={() => onToggle(tag.value)}
        className={cn(
          'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
          selected.includes(tag.value)
            ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
            : 'border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        {tag.label}
      </button>
    ))}
  </div>
)

export const CreateTask = () => {
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
    subtasks,
    addSubtask,
    removeSubtask,
    frequency,
    setFrequency,
    days,
    toggleDay,
    dueDate,
    setDueDate,
  } = useTaskCreation()

  const [subtaskInput, setSubtaskInput] = React.useState('')
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null)
  const [subtaskDetails, setSubtaskDetails] = React.useState<
    Record<number, Partial<SubtaskDetail>>
  >({})

  const isRecurring = type === 'recurring'

  const updateSubtaskDetail = (index: number, field: keyof SubtaskDetail, value: unknown) => {
    setSubtaskDetails((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: value },
    }))
  }

  const toggleSubtaskTag = (index: number, tag: string) => {
    const current = subtaskDetails[index]?.tags ?? []
    const updated = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    updateSubtaskDetail(index, 'tags', updated)
  }

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await saveTask()
    if (success) {
      setSubtaskInput('')
      setExpandedIndex(null)
      setSubtaskDetails({})
      close()
    }
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
    setExpandedIndex(null)
    setSubtaskDetails((prev) => {
      const next: Record<number, Partial<SubtaskDetail>> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const i = parseInt(k)
        if (i < index) next[i] = v
        else if (i > index) next[i - 1] = v
      })
      return next
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            <Textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="h-24 resize-none"
            />
          </FormField>

          {!isRecurring && (
            <FormField label="Due date" optional>
              <DatePicker value={dueDate} onChange={setDueDate} />
            </FormField>
          )}

          <FormField label="Tags" optional>
            <TagPicker selected={tags as string[]} onToggle={toggleTag as (t: string) => void} />
          </FormField>

          <FormField label="Subtasks" optional>
            <div className="space-y-2">
              {subtasks.length > 0 && (
                <div className="space-y-1.5">
                  {subtasks.map((s, index) => {
                    const isExpanded = expandedIndex === index
                    const detail = subtaskDetails[index] ?? {}
                    const hasDetails =
                      detail.description || detail.dueDate || (detail.tags?.length ?? 0) > 0

                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-border/50 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                          <span className="flex-1 text-sm text-foreground">{s.title}</span>

                          {hasDetails && !isExpanded && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-violet-500">
                              <Tag className="h-2.5 w-2.5" />
                            </span>
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
                          <div className="px-3 pb-3 pt-2 space-y-4 border-t border-border/40 bg-background/50">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Description
                                <span className="ml-1.5 normal-case font-normal">Optional</span>
                              </label>
                              <Textarea
                                value={detail.description ?? ''}
                                onChange={(e) =>
                                  updateSubtaskDetail(index, 'description', e.target.value)
                                }
                                placeholder="Add details to this subtask..."
                                className="h-16 resize-none text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Due date
                                <span className="ml-1.5 normal-case font-normal">Optional</span>
                              </label>
                              <DatePicker
                                value={detail.dueDate}
                                onChange={(d) => updateSubtaskDetail(index, 'dueDate', d)}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Tags
                                <span className="ml-1.5 normal-case font-normal">Optional</span>
                              </label>
                              <TagPicker
                                selected={detail.tags ?? []}
                                onToggle={(tag) => toggleSubtaskTag(index, tag)}
                              />
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
            <Button type="button" variant="ghost" onClick={() => close()}>
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
