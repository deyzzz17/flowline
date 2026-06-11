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
import { Trash2, Loader2, Pencil, CalendarDays, Clock, AlignLeft, Tag, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useCalendarCategories } from '@/hooks/calendar/use-calendar-categories'
import { useTimeFormat } from '@/hooks/calendar/use-time-format'
import type { CalendarItem, CalendarEvent } from '@/hooks/calendar/use-calendar'
import type { CalendarEventData, RecurrenceRule, EditScope } from '@/api/calendar/actions'

type DayValue = '0' | '1' | '2' | '3' | '4' | '5' | '6'

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
const DAYS_OF_WEEK: { label: string; value: DayValue }[] = [
  { label: 'S', value: '0' },
  { label: 'M', value: '1' },
  { label: 'T', value: '2' },
  { label: 'W', value: '3' },
  { label: 'T', value: '4' },
  { label: 'F', value: '5' },
  { label: 'S', value: '6' },
]

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

function recurrenceLabel(rule: RecurrenceRule | null | undefined): string {
  if (!rule?.frequency) return 'Does not repeat'
  const interval = rule.interval ?? 1
  switch (rule.frequency) {
    case 'daily':
      return interval === 1 ? 'Every day' : `Every ${interval} days`
    case 'weekly': {
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const days = rule.daysOfWeek.map((d) => dayNames[parseInt(d)]).join(', ')
        return interval === 1 ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`
      }
      return interval === 1 ? 'Every week' : `Every ${interval} weeks`
    }
    case 'monthly':
      return interval === 1 ? 'Every month' : `Every ${interval} months`
    case 'yearly':
      return interval === 1 ? 'Every year' : `Every ${interval} years`
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
  const { is24h, formatTime, formatHourLabel } = useTimeFormat()
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

  const currentTimeDisplay = (() => {
    const d = new Date(value)
    d.setHours(timeHour, timeMinute, 0, 0)
    return formatTime(d)
  })()

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
              {allDay
                ? format(value, 'MMM d, yyyy')
                : `${format(value, 'MMM d, yyyy')} · ${formatTime(value)}`}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 shadow-xl" align="start">
          <Calendar mode="single" selected={value} onSelect={handleDaySelect} autoFocus />
          {!allDay && (
            <div className="border-t border-border/40 p-3 space-y-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">Time</span>
                <span className="ml-auto text-sm font-semibold tabular-nums">
                  {currentTimeDisplay}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-0.5 max-h-28 overflow-y-auto">
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
                    {is24h ? pad(h) : formatHourLabel(h)}
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

function RecurrencePicker({
  value,
  onChange,
  startDate,
}: {
  value: RecurrenceRule | null
  onChange: (rule: RecurrenceRule | null) => void
  startDate: Date
}) {
  const [open, setOpen] = useState(false)
  const [frequency, setFrequency] = useState<RecurrenceRule['frequency']>(
    value?.frequency ?? 'weekly',
  )
  const [interval, setIntervalVal] = useState(value?.interval ?? 1)
  const [daysOfWeek, setDaysOfWeek] = useState<DayValue[]>(
    value?.daysOfWeek ?? [String(startDate.getDay()) as DayValue],
  )
  const [monthlyType, setMonthlyType] = useState<'dayOfMonth' | 'dayOfWeek'>(
    value?.monthlyType ?? 'dayOfMonth',
  )
  const [endType, setEndType] = useState<RecurrenceRule['endType']>(value?.endType ?? 'never')
  const [endDate, setEndDate] = useState(value?.endDate ?? '')
  const [endCount, setEndCount] = useState(value?.endCount ?? 10)

  const toggleDay = (d: DayValue) => {
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  const handleApply = () => {
    onChange({
      frequency,
      interval,
      daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
      monthlyType: frequency === 'monthly' ? monthlyType : undefined,
      endType,
      endDate: endType === 'onDate' ? endDate : null,
      endCount: endType === 'afterCount' ? endCount : null,
    })
    setOpen(false)
  }

  const nthWeekday = Math.ceil(startDate.getDate() / 7)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthlyDayOfWeekLabel = `Every ${['1st', '2nd', '3rd', '4th', '5th'][nthWeekday - 1]} ${dayNames[startDate.getDay()]}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3 transition-all hover:bg-muted/40"
        >
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-muted-foreground/60" />
            <p className="text-sm font-medium">{recurrenceLabel(value)}</p>
          </div>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              className="text-muted-foreground/40 hover:text-muted-foreground text-xs px-1"
            >
              ✕
            </button>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4 shadow-xl" align="start" side="top">
        <p className="text-sm font-semibold text-foreground">Repeat</p>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Frequency</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all border',
                  frequency === f
                    ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    : 'border-border/60 text-muted-foreground hover:bg-muted',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Every</Label>
          <Input
            type="number"
            min={1}
            max={99}
            value={interval}
            onChange={(e) => setIntervalVal(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-8 w-16 text-center text-sm"
          />
          <span className="text-xs text-muted-foreground">
            {frequency === 'daily'
              ? 'day(s)'
              : frequency === 'weekly'
                ? 'week(s)'
                : frequency === 'monthly'
                  ? 'month(s)'
                  : 'year(s)'}
          </span>
        </div>

        {frequency === 'weekly' && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">On days</Label>
            <div className="flex gap-1">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={cn(
                    'h-8 w-8 rounded-full text-xs font-semibold transition-all',
                    daysOfWeek.includes(d.value)
                      ? 'bg-violet-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {frequency === 'monthly' && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Repeat on</Label>
            <div className="space-y-1">
              {(['dayOfMonth', 'dayOfWeek'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMonthlyType(t)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                    monthlyType === t
                      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'h-3 w-3 rounded-full border-2 shrink-0',
                      monthlyType === t
                        ? 'border-violet-500 bg-violet-500'
                        : 'border-muted-foreground/40',
                    )}
                  />
                  {t === 'dayOfMonth'
                    ? `Monthly on day ${startDate.getDate()}`
                    : monthlyDayOfWeekLabel}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ends</Label>
          <div className="space-y-1">
            {(
              [
                { value: 'never', label: 'Never' },
                { value: 'onDate', label: 'On date' },
                { value: 'afterCount', label: 'After N occurrences' },
              ] as const
            ).map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEndType(opt.value)}
                  className={cn(
                    'h-3 w-3 rounded-full border-2 shrink-0 transition-all',
                    endType === opt.value
                      ? 'border-violet-500 bg-violet-500'
                      : 'border-muted-foreground/40',
                  )}
                />
                <span className="text-xs text-muted-foreground">{opt.label}</span>
                {opt.value === 'onDate' && endType === 'onDate' && (
                  <Input
                    type="date"
                    value={endDate.slice(0, 10)}
                    onChange={(e) => setEndDate(new Date(e.target.value).toISOString())}
                    className="h-7 text-xs ml-auto w-32"
                  />
                )}
                {opt.value === 'afterCount' && endType === 'afterCount' && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Input
                      type="number"
                      min={1}
                      max={999}
                      value={endCount}
                      onChange={(e) => setEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-7 text-xs w-16 text-center"
                    />
                    <span className="text-xs text-muted-foreground">times</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" className="flex-1" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ScopeDialog({
  open,
  onOpenChange,
  onSelect,
  action,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelect: (scope: EditScope) => void
  action: 'edit' | 'delete'
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === 'edit' ? 'Edit recurring event' : 'Delete recurring event'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This event is part of a series. Which events would you like to {action}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          {[
            { scope: 'this' as EditScope, label: 'This event', desc: 'Only this occurrence' },
            {
              scope: 'thisAndFollowing' as EditScope,
              label: 'This and following events',
              desc: 'This and all future occurrences',
            },
            {
              scope: 'all' as EditScope,
              label: 'All events',
              desc: 'Every occurrence in the series',
            },
          ].map(({ scope, label, desc }) => (
            <button
              key={scope}
              type="button"
              onClick={() => {
                onSelect(scope)
                onOpenChange(false)
              }}
              className="flex flex-col items-start rounded-xl border border-border/50 px-4 py-3 text-left transition-all hover:bg-muted/40 hover:border-border"
            >
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </button>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface CalendarEventDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  selectedItem: CalendarItem | null
  defaultDate: Date | null
  onSave: (data: CalendarEventData, scope?: EditScope, originalDate?: string) => void
  onDelete: (id: number, scope?: EditScope, originalDate?: string) => void
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
  const { formatTime } = useTimeFormat()

  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('create')
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false)
  const [scopeAction, setScopeAction] = useState<'edit' | 'delete'>('edit')
  const [pendingSaveData, setPendingSaveData] = useState<CalendarEventData | null>(null)

  const defaultStart = defaultDate ?? new Date()
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date>(defaultStart)
  const [endDate, setEndDate] = useState<Date>(defaultEnd)
  const [allDay, setAllDay] = useState(false)
  const [color, setColor] = useState('#8b5cf6')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isRecurring =
    isExistingEvent &&
    !!(selectedItem as CalendarEvent & { recurrence?: any })?.recurrence?.frequency
  const isOverride = isExistingEvent && !!(selectedItem as any)?.recurrenceId
  const originalDate = isExistingEvent
    ? ((selectedItem as any)?.originalDate ?? (selectedItem as CalendarEvent)?.startDate)
    : undefined

  useEffect(() => {
    if (!open) return
    if (isExistingEvent && selectedItem) {
      const ev = selectedItem as CalendarEvent & {
        recurrence?: RecurrenceRule
        recurrenceId?: number
      }
      setTitle(ev.title)
      setDescription(ev.description ?? '')
      setStartDate(new Date(ev.startDate))
      setEndDate(new Date(ev.endDate))
      setAllDay(ev.allDay)
      setColor(ev.color)
      setCategoryId(ev.categoryId ?? null)
      setRecurrence(ev.recurrence ?? null)
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
      setRecurrence(null)
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

  const buildSaveData = (): CalendarEventData => ({
    title: title.trim(),
    description: description.trim() || undefined,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    allDay,
    color,
    categoryId,
    recurrence: recurrence ?? undefined,
  })

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

    const data = buildSaveData()

    if (mode === 'edit' && (isRecurring || isOverride)) {
      setPendingSaveData(data)
      setScopeAction('edit')
      setScopeDialogOpen(true)
      return
    }

    onSave(data)
  }

  const handleScopeSelect = (scope: EditScope) => {
    if (scopeAction === 'edit' && pendingSaveData) {
      onSave(pendingSaveData, scope, originalDate)
      setPendingSaveData(null)
    } else if (scopeAction === 'delete' && selectedItem) {
      onDelete(selectedItem.id as number, scope, originalDate) // ← as number
    }
  }

  const handleConfirmDelete = () => {
    if (selectedItem) onDelete(selectedItem.id as number) // ← as number
    setDeleteAlertOpen(false)
  }

  const handleDeleteClick = () => {
    if (isRecurring || isOverride) {
      setScopeAction('delete')
      setScopeDialogOpen(true)
    } else {
      setDeleteAlertOpen(true)
    }
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
              {format(new Date(task.dueDate), 'EEEE, MMMM d, yyyy')} ·{' '}
              {formatTime(new Date(task.dueDate))}
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
    const ev = selectedItem as CalendarEvent & { recurrence?: RecurrenceRule }
    const isGoogle = ev.source === 'google'
    const sameDay = startDate.toDateString() === endDate.toDateString()
    const category = categories.find((c) => c.id === ev.categoryId)

    return (
      <>
        <ScopeDialog
          open={scopeDialogOpen}
          onOpenChange={setScopeDialogOpen}
          onSelect={handleScopeSelect}
          action={scopeAction}
        />
        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{ev.title}</strong> will be permanently deleted.
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

        {!isGoogle && (
          <>
            <ScopeDialog
              open={scopeDialogOpen}
              onOpenChange={setScopeDialogOpen}
              onSelect={handleScopeSelect}
              action={scopeAction}
            />
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{ev.title}</strong> will be permanently deleted.
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
          </>
        )}

        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
            <div className="h-1.5 w-full" style={{ backgroundColor: ev.color }} />
            <div className="px-5 pt-4 pb-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground leading-snug">{ev.title}</h2>
                {isGoogle && (
                  <span className="shrink-0 flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {ev.googleCalendarName ?? 'Google Calendar'}
                  </span>
                )}
              </div>

              {category && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">{category.name}</span>
                </div>
              )}

              {ev.recurrence?.frequency && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Repeat className="h-3.5 w-3.5 shrink-0" />
                  {recurrenceLabel(ev.recurrence)}
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
                        {formatTime(startDate)} – {formatTime(endDate)}
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

              {!isGoogle ? (
                <div className="flex items-center gap-2 pt-1">
                  <Button className="flex-1 gap-1.5" size="sm" onClick={() => setMode('edit')}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit event
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <ScopeDialog
        open={scopeDialogOpen}
        onOpenChange={setScopeDialogOpen}
        onSelect={handleScopeSelect}
        action={scopeAction}
      />
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{title}</strong> will be permanently deleted.
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

            <RecurrencePicker value={recurrence} onChange={setRecurrence} startDate={startDate} />

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
                  onClick={handleDeleteClick}
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
