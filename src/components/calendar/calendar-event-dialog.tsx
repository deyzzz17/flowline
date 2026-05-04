'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Trash2, Loader2, Pencil, CalendarDays, Clock, AlignLeft, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useCalendarCategories } from '@/hooks/calendar/use-calendar-categories'
import type { CalendarItem, CalendarEvent } from '@/hooks/calendar/use-calendar'
import type { CalendarEventData } from '@/api/calendar/actions'

const PRESET_COLORS = [
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
]

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

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

function DateTimePicker({
  value,
  onChange,
  allDay,
  label,
}: {
  value: Date
  onChange: (d: Date) => void
  allDay: boolean
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [timeHour, setTimeHour] = useState(value.getHours())
  const [timeMinute, setTimeMinute] = useState(value.getMinutes())

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return
    const next = new Date(day)
    next.setHours(timeHour, timeMinute, 0, 0)
    onChange(next)
    if (allDay) setOpen(false)
  }

  const handleTimeChange = (h: number, m: number) => {
    setTimeHour(h)
    setTimeMinute(m)
    const next = new Date(value)
    next.setHours(h, m, 0, 0)
    onChange(next)
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-background px-3 h-10 text-sm text-left transition-all hover:border-border focus:outline-none"
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span className="flex-1 truncate">
              {allDay ? format(value, 'MMM d, yyyy') : format(value, 'MMM d, yyyy · HH:mm')}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 shadow-xl" align="start">
          <Calendar mode="single" selected={value} onSelect={handleDaySelect} initialFocus />
          {!allDay && (
            <div className="border-t border-border/40 p-3 space-y-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">Time</span>
                <span className="ml-auto text-sm font-semibold tabular-nums">
                  {pad(timeHour)}:{pad(timeMinute)}
                </span>
              </div>
              <div className="grid grid-cols-8 gap-0.5 max-h-28 overflow-y-auto">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleTimeChange(h, timeMinute)}
                    className={cn(
                      'rounded-md py-1 text-xs font-medium transition-all',
                      timeHour === h
                        ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {pad(h)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      handleTimeChange(timeHour, m)
                      setOpen(false)
                    }}
                    className={cn(
                      'rounded-md py-1.5 text-xs font-medium transition-all',
                      timeMinute === m
                        ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    :{pad(m)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface CalendarEventDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  selectedItem: CalendarItem | null
  defaultDate: Date | null
  onSave: (data: CalendarEventData) => void
  onDelete: (id: number) => void
  isSaving: boolean
  isDeleting: boolean
}

export function CalendarEventDialog({
  open,
  onOpenChange,
  selectedItem,
  defaultDate,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: CalendarEventDialogProps) {
  const isTask = selectedItem?.type === 'task'
  const isExistingEvent = selectedItem?.type === 'event'
  const { categories } = useCalendarCategories()

  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('create')
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)

  const defaultStart = defaultDate ?? new Date()
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date>(defaultStart)
  const [endDate, setEndDate] = useState<Date>(defaultEnd)
  const [allDay, setAllDay] = useState(false)
  const [color, setColor] = useState('#8b5cf6')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (isExistingEvent && selectedItem) {
      const ev = selectedItem as CalendarEvent
      setTitle(ev.title)
      setDescription(ev.description ?? '')
      setStartDate(new Date(ev.startDate))
      setEndDate(new Date(ev.endDate))
      setAllDay(ev.allDay)
      setColor(ev.color)
      setCategoryId(ev.categoryId ?? null)
      setMode('view')
    } else if (!isTask) {
      const start = defaultDate ?? new Date()
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      setTitle('')
      setDescription('')
      setStartDate(start)
      setEndDate(end)
      setAllDay(false)
      setColor('#8b5cf6')
      setCategoryId(null)
      setMode('create')
    }
    setError(null)
  }, [open, selectedItem, defaultDate, isExistingEvent, isTask])

  const handleCategoryChange = (id: number | null) => {
    setCategoryId(id)
    if (id) {
      const cat = categories.find((c) => c.id === id)
      if (cat) setColor(cat.color)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (endDate <= startDate) {
      setError('End date must be after start date')
      return
    }
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      allDay,
      color,
      categoryId,
    })
  }

  const handleConfirmDelete = () => {
    if (selectedItem) onDelete(selectedItem.id)
    setDeleteAlertOpen(false)
  }

  if (isTask && selectedItem) {
    const task = selectedItem as any
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: task.listColor }}
              />
              Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-base font-semibold text-foreground">{selectedItem.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: task.listColor }}
              />
              {task.listName}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {format(new Date(task.dueDate), 'EEEE, MMMM d, yyyy · HH:mm')}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (mode === 'view' && isExistingEvent && selectedItem) {
    const ev = selectedItem as CalendarEvent
    const sameDay = startDate.toDateString() === endDate.toDateString()
    const category = categories.find((c) => c.id === ev.categoryId)

    return (
      <>
        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{ev.title}</strong> will be permanently deleted. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
            <div className="h-1.5 w-full" style={{ backgroundColor: ev.color }} />
            <div className="px-5 pt-4 pb-5 space-y-4">
              <h2 className="text-base font-semibold text-foreground leading-snug">{ev.title}</h2>

              {category && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">{category.name}</span>
                </div>
              )}

              <div className="flex items-start gap-3">
                <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground/60 mt-0.5" />
                <div className="text-sm text-foreground">
                  {ev.allDay ? (
                    sameDay ? (
                      format(startDate, 'EEEE, MMMM d, yyyy')
                    ) : (
                      `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`
                    )
                  ) : (
                    <>
                      <p>{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {pad(startDate.getHours())}:{pad(startDate.getMinutes())} –{' '}
                        {pad(endDate.getHours())}:{pad(endDate.getMinutes())}
                        {!sameDay && ` (${format(endDate, 'MMM d')})`}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {ev.description && (
                <div className="flex items-start gap-3">
                  <AlignLeft className="h-4 w-4 shrink-0 text-muted-foreground/60 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{ev.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button className="flex-1 gap-1.5" size="sm" onClick={() => setMode('edit')}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit event
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteAlertOpen(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{title}</strong> will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete event'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? 'Edit event' : 'New event'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setError(null)
                }}
                placeholder="Event title..."
                className="h-10"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                Description
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">Optional</span>
              </Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                className="w-full min-h-20 resize-none rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary/40 placeholder:text-muted-foreground"
              />
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Calendar
                  <span className="text-xs font-normal text-muted-foreground">Optional</span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCategoryId(null)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                      categoryId === null
                        ? 'border-border bg-muted text-foreground'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    None
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all"
                      style={
                        categoryId === cat.id
                          ? {
                              backgroundColor: hexToRgba(cat.color, 0.15),
                              borderColor: hexToRgba(cat.color, 0.5),
                              color: cat.color,
                            }
                          : { borderColor: 'var(--border)', opacity: 0.7 }
                      }
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setAllDay(!allDay)}
              className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3 transition-all hover:bg-muted/40"
            >
              <p className="text-sm font-medium">All day</p>
              <div
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors',
                  allDay ? 'bg-violet-500' : 'bg-muted-foreground/30',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                    allDay ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <DateTimePicker
                label="Start"
                value={startDate}
                onChange={setStartDate}
                allDay={allDay}
              />
              <DateTimePicker label="End" value={endDate} onChange={setEndDate} allDay={allDay} />
            </div>

            {!categoryId && (
              <div className="space-y-2">
                <Label className="text-sm">Color</Label>
                <div className="flex items-center gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        'h-6 w-6 rounded-full transition-all hover:scale-110',
                        color === c && 'ring-2 ring-offset-2 ring-offset-background',
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="relative ml-1">
                    <div
                      className="h-6 w-6 rounded-full border-2 border-dashed border-border/60 cursor-pointer"
                      style={{
                        backgroundColor: PRESET_COLORS.includes(color) ? 'transparent' : color,
                      }}
                    />
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-row gap-2 pt-1">
              {mode === 'edit' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteAlertOpen(true)}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive mr-auto"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => (mode === 'edit' ? setMode('view') : onOpenChange(false))}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : mode === 'edit' ? (
                  'Save changes'
                ) : (
                  'Create event'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
