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
  Check,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { useManageForm } from '@/hooks/tasks/use-manage-form'
import { useTaskCreation } from '@/hooks/tasks/use-task-creation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#14b8a6',
]

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
    resetForm,
  } = useTaskCreation()

  const queryClient = useQueryClient()

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

  const [showNewTag, setShowNewTag] = React.useState(false)
  const [newTagName, setNewTagName] = React.useState('')
  const [newTagColor, setNewTagColor] = React.useState(PRESET_COLORS[0])
  const [customColorInput, setCustomColorInput] = React.useState('')

  const [subtaskInput, setSubtaskInput] = React.useState('')
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null)

  const isRecurring = type === 'recurring'

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    const color = customColorInput.match(/^#[0-9a-fA-F]{6}$/) ? customColorInput : newTagColor
    await createTagMutation.mutateAsync({ name: newTagName.trim(), color })
    setNewTagName('')
    setCustomColorInput('')
    setNewTagColor(PRESET_COLORS[0])
    setShowNewTag(false)
  }

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await saveTask()
    if (success) {
      setSubtaskInput('')
      setExpandedIndex(null)
      setShowNewTag(false)
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
    if (expandedIndex === index) setExpandedIndex(null)
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1)
  }

  const handleClose = () => {
    resetForm()
    setSubtaskInput('')
    setExpandedIndex(null)
    setShowNewTag(false)
    setNewTagName('')
    setCustomColorInput('')
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
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleCustomTag(String(tag.id))}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                          isSelected
                            ? 'border-transparent text-white'
                            : 'border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                        style={
                          isSelected ? { backgroundColor: tag.color, borderColor: tag.color } : {}
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: isSelected ? 'white' : tag.color }}
                        />
                        {tag.name}
                      </button>
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

                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Color
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setNewTagColor(color)
                            setCustomColorInput('')
                          }}
                          className="h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center"
                          style={{
                            backgroundColor: color,
                            borderColor:
                              newTagColor === color && !customColorInput ? 'white' : 'transparent',
                            boxShadow:
                              newTagColor === color && !customColorInput
                                ? `0 0 0 2px ${color}`
                                : 'none',
                          }}
                        >
                          {newTagColor === color && !customColorInput && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-full border border-border/60 shrink-0"
                        style={{
                          backgroundColor: customColorInput.match(/^#[0-9a-fA-F]{6}$/)
                            ? customColorInput
                            : 'transparent',
                        }}
                      />
                      <Input
                        value={customColorInput}
                        onChange={(e) => setCustomColorInput(e.target.value)}
                        placeholder="#3b82f6"
                        className="h-7 text-xs font-mono"
                      />
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
                          <div className="px-3 pb-3 pt-2.5 space-y-4 border-t border-border/40 bg-background/50">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Description{' '}
                                <span className="normal-case font-normal">— Optional</span>
                              </label>
                              <Textarea
                                value={s.description ?? ''}
                                onChange={(e) =>
                                  updateSubtaskDetail(index, 'description', e.target.value)
                                }
                                placeholder="Add details to this subtask..."
                                className="h-16 resize-none text-sm"
                              />
                            </div>

                            {!isRecurring && (
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Due date{' '}
                                  <span className="normal-case font-normal">— Optional</span>
                                </label>
                                <DatePicker
                                  value={s.dueDate}
                                  onChange={(d) => updateSubtaskDetail(index, 'dueDate', d)}
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Tags <span className="normal-case font-normal">— Optional</span>
                              </label>
                              <div className="flex flex-wrap gap-1.5">
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
