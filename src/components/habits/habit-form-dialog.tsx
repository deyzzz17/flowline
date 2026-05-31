'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Clock,
  CalendarDays,
  Target,
  BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import type { HabitData, HabitWithStats, TrackingField, HabitGoal } from '@/api/habits/actions'

const PRESET_COLORS = [
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#10b981',
  '#84cc16',
  '#f59e0b',
  '#14b8a6',
  '#64748b',
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

const DEFAULT_TRACKING_FIELDS: Omit<TrackingField, 'enabled'>[] = [
  { key: 'reps', label: 'Reps', type: 'number', isDefault: true },
  { key: 'duration', label: 'Duration (min)', type: 'number', isDefault: true },
  { key: 'mood', label: 'Mood', type: 'number', isDefault: true },
  { key: 'energy', label: 'Energy', type: 'number', isDefault: true },
  { key: 'difficulty', label: 'Difficulty', type: 'number', isDefault: true },
  { key: 'note', label: 'Note', type: 'text', isDefault: true },
]

type TrackingFieldType = 'number' | 'text' | 'boolean'
type FieldTarget = { fieldKey: string; targetValue: number }

function parseJsonField<T>(raw: any): T | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  return raw as T
}

function buildTrackingFields(saved: TrackingField[] | null | undefined): TrackingField[] {
  const savedArr = saved ?? []
  const savedMap = new Map(savedArr.map((f) => [f.key, f]))
  const defaults: TrackingField[] = DEFAULT_TRACKING_FIELDS.map((f) => ({
    ...f,
    enabled: savedMap.get(f.key)?.enabled ?? false,
  }))
  const customs = savedArr.filter((f) => !f.isDefault)
  return [...defaults, ...customs]
}

function getInitialState(initialData?: HabitWithStats) {
  if (!initialData) {
    return {
      name: '',
      description: '',
      color: '#f97316',
      categoryTag: '',
      frequency: 'daily' as HabitData['frequency'],
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      timesPerWeek: 3,
      startDate: '',
      showInCalendar: false,
      calendarMode: 'time' as 'time' | 'relative',
      habitTime: '08:00',
      habitDuration: 30,
      relativePosition: 'before' as 'before' | 'after',
      relativeEventId: null as number | null,
      trackingFields: buildTrackingFields([]),
      calendarOpen: false,
      trackingOpen: false,
      goalOpen: false,
      goalType: 'manual' as 'field' | 'manual',
      goalEndOnReach: false,
      goalDescription: '',
      goalFieldTargets: [] as FieldTarget[],
    }
  }

  const savedFields = parseJsonField<TrackingField[]>(initialData.trackingFields)
  const goal = parseJsonField<HabitGoal>(initialData.goal)

  let goalFieldTargets: FieldTarget[] = []
  if (goal?.fieldTargets) {
    goalFieldTargets = goal.fieldTargets
  } else if (goal?.fieldKey) {
    goalFieldTargets = [{ fieldKey: goal.fieldKey, targetValue: goal.targetValue ?? 10 }]
  }

  return {
    name: initialData.name,
    description: initialData.description ?? '',
    color: initialData.color,
    categoryTag: initialData.categoryTag ?? '',
    frequency: initialData.frequency,
    daysOfWeek: initialData.daysOfWeek ?? ['mon', 'tue', 'wed', 'thu', 'fri'],
    timesPerWeek: initialData.timesPerWeek ?? 3,
    startDate: initialData.startDate ?? '',
    showInCalendar: initialData.showInCalendar ?? false,
    calendarMode: (initialData.calendarMode ?? 'time') as 'time' | 'relative',
    habitTime: initialData.habitTime ?? '08:00',
    habitDuration: initialData.habitDuration ?? 30,
    relativePosition: (initialData.relativePosition ?? 'before') as 'before' | 'after',
    relativeEventId: initialData.relativeEventId ?? null,
    trackingFields: buildTrackingFields(savedFields),
    calendarOpen: initialData.showInCalendar ?? false,
    trackingOpen: (savedFields ?? []).some((f) => f.enabled),
    goalOpen: !!goal?.description,
    goalType: (goal?.type ?? 'manual') as 'field' | 'manual',
    goalEndOnReach: goal?.endOnReach ?? false,
    goalDescription: goal?.description ?? '',
    goalFieldTargets,
  }
}

function Section({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
  badge,
}: {
  title: string
  icon: React.ElementType
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: string
}) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-xs font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </button>
      {open && (
        <div className="border-t border-border/40 px-4 py-4 space-y-4 bg-muted/10">{children}</div>
      )}
    </div>
  )
}

function HabitFormInner({
  initialData,
  onOpenChange,
  onSubmit,
}: {
  initialData?: HabitWithStats
  onOpenChange: (v: boolean) => void
  onSubmit: (data: HabitData) => Promise<void>
}) {
  const init = getInitialState(initialData)

  const [name, setName] = useState(init.name)
  const [description, setDescription] = useState(init.description)
  const [color, setColor] = useState(init.color)
  const [categoryTag, setCategoryTag] = useState(init.categoryTag)
  const [frequency, setFrequency] = useState(init.frequency)
  const [daysOfWeek, setDaysOfWeek] = useState(init.daysOfWeek)
  const [timesPerWeek, setTimesPerWeek] = useState(init.timesPerWeek)
  const [startDate, setStartDate] = useState(init.startDate)
  const [showInCalendar, setShowInCalendar] = useState(init.showInCalendar)
  const [calendarMode, setCalendarMode] = useState(init.calendarMode)
  const [habitTime, setHabitTime] = useState(init.habitTime)
  const [habitDuration, setHabitDuration] = useState(init.habitDuration)
  const [relativePosition, setRelativePosition] = useState(init.relativePosition)
  const [relativeEventId, setRelativeEventId] = useState(init.relativeEventId)
  const [trackingFields, setTrackingFields] = useState(init.trackingFields)
  const [calendarOpen, setCalendarOpen] = useState(init.calendarOpen)
  const [trackingOpen, setTrackingOpen] = useState(init.trackingOpen)
  const [goalOpen, setGoalOpen] = useState(init.goalOpen)
  const [goalType, setGoalType] = useState(init.goalType)
  const [goalEndOnReach, setGoalEndOnReach] = useState(init.goalEndOnReach)
  const [goalDescription, setGoalDescription] = useState(init.goalDescription)
  const [goalFieldTargets, setGoalFieldTargets] = useState<FieldTarget[]>(init.goalFieldTargets)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<TrackingFieldType>('number')
  const [showAddField, setShowAddField] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const { data: calendarEvents } = useQuery({
    queryKey: ['calendar-events-flowline-recurring', startDate, frequency],
    queryFn: async () => {
      const from = startDate ? new Date(startDate) : new Date()
      const to = new Date(from)
      to.setFullYear(to.getFullYear() + 1)
      return api.calendar.listFlowline(from.toISOString(), to.toISOString())
    },
    enabled: calendarOpen && showInCalendar && calendarMode === 'relative',
    staleTime: 60_000,
  })

  const uniqueRecurringEvents = (calendarEvents?.docs ?? [])
    .filter((e: any) => {
      if (!e.recurrence?.frequency) return false
      if (frequency === 'daily' && e.recurrence.frequency === 'daily') return true
      if (frequency === 'days_of_week' && e.recurrence.frequency === 'weekly') return true
      if (frequency === 'times_per_week') return true
      return false
    })
    .filter((e: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.id === e.id) === idx)

  const toggleDay = (day: string) =>
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))

  const toggleTrackingField = (key: string) =>
    setTrackingFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)),
    )

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return
    setTrackingFields((prev) => [
      ...prev,
      {
        key: `custom_${Date.now()}`,
        label: newFieldLabel.trim(),
        type: newFieldType,
        isDefault: false,
        enabled: true,
      },
    ])
    setNewFieldLabel('')
    setNewFieldType('number')
    setShowAddField(false)
  }

  const removeCustomField = (key: string) => {
    setTrackingFields((prev) => prev.filter((f) => f.key !== key))
    setGoalFieldTargets((prev) => prev.filter((t) => t.fieldKey !== key))
  }

  const toggleGoalField = (key: string) => {
    setGoalFieldTargets((prev) => {
      const exists = prev.find((t) => t.fieldKey === key)
      if (exists) return prev.filter((t) => t.fieldKey !== key)
      return [...prev, { fieldKey: key, targetValue: 10 }]
    })
  }

  const setGoalFieldTargetValue = (key: string, value: number) => {
    setGoalFieldTargets((prev) =>
      prev.map((t) => (t.fieldKey === key ? { ...t, targetValue: Math.max(1, value) } : t)),
    )
  }

  const enabledFields = trackingFields.filter((f) => f.enabled)
  const enabledFieldsCount = enabledFields.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsPending(true)

    const calendarConfig = showInCalendar
      ? {
          showInCalendar: true,
          calendarMode,
          habitTime: calendarMode === 'time' ? habitTime : undefined,
          habitDuration,
          relativePosition: calendarMode === 'relative' ? relativePosition : undefined,
          relativeEventId: calendarMode === 'relative' ? relativeEventId : undefined,
        }
      : { showInCalendar: false }

    const goalConfig =
      goalOpen && goalDescription.trim()
        ? {
            type: goalType,
            fieldTargets: goalType === 'field' ? goalFieldTargets : undefined,
            endOnReach: goalType === 'field' ? goalEndOnReach : undefined,
            description: goalDescription.trim(),
          }
        : goalOpen === false && !goalDescription.trim()
          ? undefined
          : null

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      categoryTag: categoryTag.trim() || undefined,
      frequency,
      daysOfWeek: frequency === 'days_of_week' ? daysOfWeek : undefined,
      timesPerWeek: frequency === 'times_per_week' ? timesPerWeek : undefined,
      startDate: startDate || undefined,
      trackingFields,
      goal: goalConfig as HabitGoal | null | undefined,
      ...calendarConfig,
    } as any)
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning workout"
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            Description <span className="text-xs font-normal text-muted-foreground">Optional</span>
          </Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why this habit matters..."
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full transition-all hover:scale-110"
                style={{
                  backgroundColor: c,
                  ...(color === c && { outline: `2px solid ${c}`, outlineOffset: '2px' }),
                }}
              />
            ))}
            <div className="relative">
              <div
                className="h-7 w-7 rounded-full border-2 border-dashed border-border/60 cursor-pointer"
                style={{ backgroundColor: PRESET_COLORS.includes(color) ? 'transparent' : color }}
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
        <div className="space-y-1.5">
          <Label>
            Category <span className="text-xs font-normal text-muted-foreground">Optional</span>
          </Label>
          <Input
            value={categoryTag}
            onChange={(e) => setCategoryTag(e.target.value)}
            placeholder="e.g. Health, Fitness, Learning..."
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label>Frequency</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { value: 'daily', label: 'Every day' },
                { value: 'days_of_week', label: 'Custom days' },
                { value: 'times_per_week', label: 'X per week' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFrequency(opt.value)}
                className={cn(
                  'rounded-xl border py-2 text-xs font-medium transition-all',
                  frequency === opt.value
                    ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    : 'border-border/60 text-muted-foreground hover:bg-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {frequency === 'days_of_week' && (
            <div className="flex gap-1 pt-1">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    'flex-1 rounded-lg border py-1.5 text-[11px] font-semibold transition-all',
                    daysOfWeek.includes(day.value)
                      ? 'border-transparent text-white'
                      : 'border-border/60 text-muted-foreground hover:bg-muted',
                  )}
                  style={daysOfWeek.includes(day.value) ? { backgroundColor: color } : undefined}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}
          {frequency === 'times_per_week' && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-muted-foreground">Times per week</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimesPerWeek((v) => Math.max(1, v - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold">{timesPerWeek}</span>
                <button
                  type="button"
                  onClick={() => setTimesPerWeek((v) => Math.min(7, v + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>
            Start date <span className="text-xs font-normal text-muted-foreground">Optional</span>
          </Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      <Section
        title="Calendar"
        icon={CalendarDays}
        open={calendarOpen}
        onToggle={() => setCalendarOpen((v) => !v)}
        badge="Optional"
      >
        <button
          type="button"
          onClick={() => setShowInCalendar((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-background px-4 py-3 transition-all hover:bg-muted/40"
        >
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Show in calendar</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Display this habit as a recurring event
            </p>
          </div>
          <div
            className={cn(
              'relative ml-4 h-5 w-9 shrink-0 rounded-full transition-colors',
              showInCalendar ? 'bg-violet-500' : 'bg-muted-foreground/30',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                showInCalendar ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </div>
        </button>
        {showInCalendar && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { value: 'time', label: 'Fixed time' },
                  { value: 'relative', label: 'Relative to event' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCalendarMode(opt.value)}
                  className={cn(
                    'rounded-xl border py-2 text-xs font-medium transition-all',
                    calendarMode === opt.value
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-border/60 text-muted-foreground hover:bg-muted',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {calendarMode === 'time' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Time</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <Input
                      type="time"
                      value={habitTime}
                      onChange={(e) => setHabitTime(e.target.value)}
                      className="h-9 flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Duration (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHabitDuration((v) => Math.max(5, v - 5))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold">
                      {habitDuration} min
                    </span>
                    <button
                      type="button"
                      onClick={() => setHabitDuration((v) => Math.min(480, v + 5))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
            {calendarMode === 'relative' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Position</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['before', 'after'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setRelativePosition(pos)}
                        className={cn(
                          'rounded-xl border py-2 text-xs font-medium transition-all capitalize',
                          relativePosition === pos
                            ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                            : 'border-border/60 text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {pos} event
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Recurring event</Label>
                  {uniqueRecurringEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 py-2 text-center">
                      No matching recurring events found.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {uniqueRecurringEvents.map((e: any) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setRelativeEventId(relativeEventId === e.id ? null : e.id)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs transition-all',
                            relativeEventId === e.id
                              ? 'border-violet-500/40 bg-violet-500/10'
                              : 'border-border/60 bg-background hover:bg-muted',
                          )}
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: e.color }}
                          />
                          <span className="flex-1 truncate font-medium text-foreground">
                            {e.title}
                          </span>
                          {relativeEventId === e.id && (
                            <Check className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Duration (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHabitDuration((v) => Math.max(5, v - 5))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold">
                      {habitDuration} min
                    </span>
                    <button
                      type="button"
                      onClick={() => setHabitDuration((v) => Math.min(480, v + 5))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section
        title="Tracking fields"
        icon={BarChart2}
        open={trackingOpen}
        onToggle={() => setTrackingOpen((v) => !v)}
        badge={enabledFieldsCount > 0 ? `${enabledFieldsCount} active` : 'Optional'}
      >
        <p className="text-xs text-muted-foreground">
          Enable fields to track data each time you complete this habit.
        </p>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
            Default fields
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {trackingFields
              .filter((f) => f.isDefault)
              .map((field) => (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => toggleTrackingField(field.key)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all text-left',
                    field.enabled
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-border/60 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <div
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 rounded border-2 flex items-center justify-center transition-all',
                      field.enabled ? 'bg-violet-500 border-violet-500' : 'border-border/60',
                    )}
                  >
                    {field.enabled && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
                  </div>
                  {field.label}
                </button>
              ))}
          </div>
        </div>
        {trackingFields.filter((f) => !f.isDefault).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
              Custom fields
            </p>
            <div className="space-y-1">
              {trackingFields
                .filter((f) => !f.isDefault)
                .map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTrackingField(field.key)}
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 rounded border-2 flex items-center justify-center transition-all',
                        field.enabled ? 'bg-violet-500 border-violet-500' : 'border-border/60',
                      )}
                    >
                      {field.enabled && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
                    </button>
                    <span className="flex-1 text-xs font-medium text-foreground">
                      {field.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 capitalize">
                      {field.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.key)}
                      className="text-muted-foreground/30 hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
        {showAddField ? (
          <div className="rounded-xl border border-border/50 bg-background p-3 space-y-2.5">
            <Input
              autoFocus
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="Field name..."
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomField()
                }
              }}
            />
            <div className="flex gap-1.5">
              {(['number', 'text', 'boolean'] as TrackingFieldType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewFieldType(t)}
                  className={cn(
                    'flex-1 rounded-lg border py-1.5 text-[11px] font-medium capitalize transition-all',
                    newFieldType === t
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-border/60 text-muted-foreground hover:bg-muted',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={addCustomField}
                disabled={!newFieldLabel.trim()}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
                Add field
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddField(false)
                  setNewFieldLabel('')
                }}
                className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddField(true)}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-border/60 px-3 py-1 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-all"
          >
            <Plus className="h-3 w-3" />
            New field
          </button>
        )}
      </Section>

      <Section
        title="Goal"
        icon={Target}
        open={goalOpen}
        onToggle={() => setGoalOpen((v) => !v)}
        badge={goalOpen && goalDescription.trim() ? 'Set' : 'Optional'}
      >
        <p className="text-xs text-muted-foreground">
          Set a goal to track your progress and stay motivated.
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs">Goal description</Label>
          <Input
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            placeholder="e.g. Run 100km total, Complete 30 sessions..."
            className="h-9 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { value: 'manual', label: 'Manual check' },
              { value: 'field', label: 'Field target' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGoalType(opt.value)}
              className={cn(
                'rounded-xl border py-2 text-xs font-medium transition-all',
                goalType === opt.value
                  ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                  : 'border-border/60 text-muted-foreground hover:bg-muted',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {goalType === 'field' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Tracking fields & targets</Label>
              {enabledFields.filter((f) => f.type === 'number').length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-1">
                  Enable a number field in Tracking fields first.
                </p>
              ) : (
                <div className="space-y-2">
                  {enabledFields
                    .filter((f) => f.type === 'number')
                    .map((field) => {
                      const target = goalFieldTargets.find((t) => t.fieldKey === field.key)
                      const isSelected = !!target
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => toggleGoalField(field.key)}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all text-left',
                              isSelected
                                ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                : 'border-border/60 text-muted-foreground hover:bg-muted',
                            )}
                          >
                            <div
                              className={cn(
                                'h-3.5 w-3.5 shrink-0 rounded border-2 flex items-center justify-center transition-all',
                                isSelected ? 'bg-violet-500 border-violet-500' : 'border-border/60',
                              )}
                            >
                              {isSelected && (
                                <Check className="h-2 w-2 text-white" strokeWidth={3} />
                              )}
                            </div>
                            <span className="flex-1">{field.label}</span>
                          </button>
                          {isSelected && (
                            <div className="flex items-center gap-2 pl-6">
                              <span className="text-[11px] text-muted-foreground shrink-0">
                                Target:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGoalFieldTargetValue(
                                      field.key,
                                      (target?.targetValue ?? 10) - 1,
                                    )
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-border/60 text-xs hover:bg-muted"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={target?.targetValue ?? 10}
                                  onChange={(e) =>
                                    setGoalFieldTargetValue(field.key, Number(e.target.value))
                                  }
                                  className="w-16 h-6 rounded-md border border-border/60 bg-background px-2 text-center text-xs outline-none focus:border-primary/40"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGoalFieldTargetValue(
                                      field.key,
                                      (target?.targetValue ?? 10) + 1,
                                    )
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-border/60 text-xs hover:bg-muted"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setGoalEndOnReach((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-background px-4 py-3 transition-all hover:bg-muted/40"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">End habit on reach</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {goalEndOnReach
                    ? 'Habit ends when all targets are reached'
                    : 'Targets are milestones, habit continues'}
                </p>
              </div>
              <div
                className={cn(
                  'relative ml-4 h-5 w-9 shrink-0 rounded-full transition-colors',
                  goalEndOnReach ? 'bg-violet-500' : 'bg-muted-foreground/30',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                    goalEndOnReach ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </div>
            </button>
          </div>
        )}
      </Section>

      <DialogFooter className="pt-1">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || isPending} className="gap-2">
          {isPending ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              {initialData ? 'Save changes' : 'Create habit'}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function HabitFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: HabitData) => Promise<void>
  initialData?: HabitWithStats
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit habit' : 'New habit'}</DialogTitle>
        </DialogHeader>
        <HabitFormInner
          key={`${open}-${initialData?.id ?? 'new'}`}
          initialData={initialData}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}
