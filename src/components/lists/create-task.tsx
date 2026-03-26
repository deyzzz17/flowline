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
import { AlertCircleIcon, Plus, X, RefreshCw, Circle, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useManageForm } from '@/hooks/tasks/use-manage-form'
import { useTaskCreation } from '@/hooks/tasks/use-task-creation'

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
  const [calendarOpen, setCalendarOpen] = React.useState(false)

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await saveTask()
    if (success) {
      setSubtaskInput('')
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

        <form onSubmit={handleOnSubmit} className="space-y-5">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="taskTitle" className="text-sm font-medium">
                Title
              </label>
              {showError && (
                <p className="flex items-center gap-1 text-xs font-semibold text-destructive animate-in fade-in slide-in-from-right-1">
                  <AlertCircleIcon size={12} />
                  Title is required
                </p>
              )}
            </div>
            <Input
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={cn(
                'transition-all',
                showError && 'border-destructive focus-visible:ring-destructive bg-destructive/5',
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="taskDescription" className="text-sm font-medium">
              Description
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">Optional</span>
            </label>
            <Textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="h-20 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Due date
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">Optional</span>
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex h-10 w-full items-center gap-2 rounded-xl border border-border/60 bg-background px-3 text-sm transition-all hover:bg-muted',
                    !dueDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left">
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </span>
                  {dueDate && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDueDate(undefined)
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
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date)
                    setCalendarOpen(false)
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Tags
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">Optional</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value as never)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                    tags.includes(tag.value as never)
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Subtasks
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">Optional</span>
            </label>

            {subtasks.length > 0 && (
              <div className="space-y-1 mb-2">
                {subtasks.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                    <Circle className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    <span className="flex-1 text-sm text-foreground">{s.title}</span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(i)}
                      className="text-muted-foreground/50 transition-colors hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                placeholder="Add a subtask..."
                className="h-9 text-sm"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!subtaskInput.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {type === 'recurring' && (
            <div className="space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Recurrence
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFrequency('daily')}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-xs font-medium transition-all',
                    frequency === 'daily'
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  Every day
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency('custom')}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-xs font-medium transition-all',
                    frequency === 'custom'
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  Custom days
                </button>
              </div>

              {frequency === 'custom' && (
                <div className="flex gap-1.5">
                  {DAY_OPTIONS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value as never)}
                      className={cn(
                        'flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all',
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

          <DialogFooter className="flex-row gap-2 sm:justify-end pt-2">
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
