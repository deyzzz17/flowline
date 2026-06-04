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
  Pencil,
  Trophy,
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

interface GoalDraft {
  id: string
  type: 'field' | 'manual'
  description: string
  fieldTargets: FieldTarget[]
  endOnReach: boolean
  completedAt?: string | null
}

function emptyGoalDraft(): GoalDraft {
  return {
    id: `goal_${Date.now()}`,
    type: 'manual',
    description: '',
    fieldTargets: [],
    endOnReach: false,
    completedAt: null,
  }
}

function draftFromGoal(goal: HabitGoal): GoalDraft {
  return {
    id: goal.id ?? `goal_${Date.now()}`,
    type: goal.type,
    description: goal.description ?? '',
    fieldTargets:
      goal.fieldTargets ??
      (goal.fieldKey ? [{ fieldKey: goal.fieldKey, targetValue: goal.targetValue ?? 10 }] : []),
    endOnReach: goal.endOnReach ?? false,
    completedAt: goal.completedAt,
  }
}

function draftToGoal(draft: GoalDraft): HabitGoal {
  return {
    id: draft.id,
    type: draft.type,
    description: draft.description,
    fieldTargets: draft.type === 'field' ? draft.fieldTargets : undefined,
    endOnReach: draft.type === 'field' ? draft.endOnReach : undefined,
    completedAt: draft.completedAt,
  }
}

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
      startDate: new Date().toISOString().split('T')[0],
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
      goals: [] as HabitGoal[],
      repeatEveryDays: 2,
    }
  }

  const savedFields = parseJsonField<TrackingField[]>(initialData.trackingFields)

  let goals: HabitGoal[] = []
  const rawGoals = parseJsonField<HabitGoal[]>((initialData as any).goals)
  if (rawGoals && rawGoals.length > 0) {
    goals = rawGoals
  } else {
    const oldGoal = parseJsonField<HabitGoal>((initialData as any).goal)
    if (oldGoal?.description) {
      goals = [{ ...oldGoal, id: oldGoal.id ?? `goal_${Date.now()}` }]
    }
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
    goalOpen: goals.length > 0,
    goals,
    repeatEveryDays: (initialData as any).repeatEveryDays ?? 2,
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

function GoalForm({
  draft,
  enabledNumberFields,
  onChange,
  onSave,
  onCancel,
}: {
  draft: GoalDraft
  enabledNumberFields: TrackingField[]
  onChange: (d: GoalDraft) => void
  onSave: () => void
  onCancel: () => void
}) {
  const canSave = draft.description.trim().length > 0

  const toggleFieldTarget = (key: string) => {
    const exists = draft.fieldTargets.find((t) => t.fieldKey === key)
    onChange({
      ...draft,
      fieldTargets: exists
        ? draft.fieldTargets.filter((t) => t.fieldKey !== key)
        : [...draft.fieldTargets, { fieldKey: key, targetValue: 10 }],
    })
  }

  const setTargetValue = (key: string, value: number) => {
    onChange({
      ...draft,
      fieldTargets: draft.fieldTargets.map((t) =>
        t.fieldKey === key ? { ...t, targetValue: Math.max(1, value) } : t,
      ),
    })
  }

  return (
    <div className="rounded-xl border border-violet-500/20 bg-background p-4 space-y-3">
      <Input
        autoFocus
        value={draft.description}
        onChange={(e) => onChange({ ...draft, description: e.target.value })}
        placeholder="e.g. Run 100km total, Complete 30 sessions..."
        className="h-9 text-sm"
      />

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onChange({ ...draft, type: 'manual' })}
          className={cn(
            'rounded-xl border py-2 text-xs font-medium transition-all',
            draft.type === 'manual'
              ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
              : 'border-border/60 text-muted-foreground hover:bg-muted',
          )}
        >
          Manual check
        </button>
        <button
          type="button"
          onClick={() => enabledNumberFields.length > 0 && onChange({ ...draft, type: 'field' })}
          disabled={enabledNumberFields.length === 0}
          className={cn(
            'rounded-xl border py-2 text-xs font-medium transition-all',
            enabledNumberFields.length === 0
              ? 'border-border/30 text-muted-foreground/30 cursor-not-allowed'
              : draft.type === 'field'
                ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                : 'border-border/60 text-muted-foreground hover:bg-muted',
          )}
        >
          Field target
        </button>
      </div>

      {draft.type === 'field' && enabledNumberFields.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
            Fields & targets
          </p>
          {enabledNumberFields.map((field) => {
            const target = draft.fieldTargets.find((t) => t.fieldKey === field.key)
            const isSelected = !!target
            return (
              <div key={field.key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleFieldTarget(field.key)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all text-left',
                    isSelected
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-border/60 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <div
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 rounded border-2 flex items-center justify-center',
                      isSelected ? 'bg-violet-500 border-violet-500' : 'border-border/60',
                    )}
                  >
                    {isSelected && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
                  </div>
                  <span className="flex-1">{field.label}</span>
                </button>
                {isSelected && (
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-[11px] text-muted-foreground shrink-0">Target:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTargetValue(field.key, (target?.targetValue ?? 10) - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-border/60 text-xs hover:bg-muted"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={target?.targetValue ?? 10}
                        onChange={(e) => setTargetValue(field.key, Number(e.target.value))}
                        className="w-14 h-6 rounded-md border border-border/60 bg-background px-2 text-center text-xs outline-none focus:border-primary/40"
                      />
                      <button
                        type="button"
                        onClick={() => setTargetValue(field.key, (target?.targetValue ?? 10) + 1)}
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

      {draft.type === 'field' && (
        <button
          type="button"
          onClick={() => onChange({ ...draft, endOnReach: !draft.endOnReach })}
          className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 transition-all hover:bg-muted/40"
        >
          <div className="text-left">
            <p className="text-xs font-medium text-foreground">End habit on reach</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {draft.endOnReach
                ? 'Habit ends when all targets are reached'
                : 'Targets are milestones, habit continues'}
            </p>
          </div>
          <div
            className={cn(
              'relative ml-3 h-5 w-9 shrink-0 rounded-full transition-colors',
              draft.endOnReach ? 'bg-violet-500' : 'bg-muted-foreground/30',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                draft.endOnReach ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </div>
        </button>
      )}

      <div className="flex gap-1.5 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
        >
          <Check className="h-3 w-3" />
          Save goal
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
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
  const [goals, setGoals] = useState<HabitGoal[]>(init.goals)
  const [editingGoal, setEditingGoal] = useState<GoalDraft | null>(null)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<TrackingFieldType>('number')
  const [showAddField, setShowAddField] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [repeatEveryDays, setRepeatEveryDays] = useState(init.repeatEveryDays)

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
    .filter((e: any) => !!e.recurrence?.frequency)
    .filter((e: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.id === e.id) === idx)
    .map((e: any) => {
      const eventFreq: string = e.recurrence?.frequency ?? ''
      const eventInterval: number = e.recurrence?.interval ?? 1
      const eventDays: string[] = e.recurrence?.daysOfWeek ?? []

      let compatible = false
      let compatLabel = ''

      if (frequency === 'daily') {
        if (eventFreq === 'daily' && eventInterval === 1) {
          compatible = true
          compatLabel = 'Perfect match'
        } else {
          compatible = false
          compatLabel = 'Incompatible — event not daily'
        }
      } else if (frequency === 'days_of_week') {
        if (eventFreq === 'weekly') {
          if (eventDays.length === 0) {
            compatible = true
            compatLabel = 'Check day alignment'
          } else {
            const eventDaySet = new Set(eventDays)
            const allCovered = daysOfWeek.every((d) => eventDaySet.has(d))
            const exactMatch = allCovered && daysOfWeek.length === eventDays.length
            if (exactMatch) {
              compatible = true
              compatLabel = 'Perfect match'
            } else if (allCovered) {
              compatible = true
              compatLabel = 'Compatible — event has more days'
            } else {
              compatible = false
              compatLabel = 'Incompatible — days mismatch'
            }
          }
        } else if (eventFreq === 'daily' && eventInterval === 1) {
          compatible = true
          compatLabel = 'Compatible — event is daily'
        } else {
          compatible = false
          compatLabel = 'Incompatible frequency'
        }
      } else if (frequency === 'times_per_week') {
        if (eventFreq === 'weekly' || (eventFreq === 'daily' && eventInterval === 1)) {
          compatible = true
          compatLabel = 'Compatible — align days manually'
        } else {
          compatible = false
          compatLabel = 'Incompatible frequency'
        }
      } else if (frequency === 'every_x_days') {
        if (eventFreq === 'daily' && eventInterval === repeatEveryDays) {
          compatible = true
          compatLabel = startDate
            ? 'Perfect match — verify start date'
            : 'Match — set start date to align'
        } else if (eventFreq === 'daily' && eventInterval === 1) {
          compatible = true
          compatLabel = 'Compatible — event is daily'
        } else if (eventFreq === 'daily' && eventInterval !== repeatEveryDays) {
          compatible = false
          compatLabel = `Incompatible — event every ${eventInterval}d vs habit every ${repeatEveryDays}d`
        } else {
          compatible = false
          compatLabel = 'Incompatible frequency'
        }
      }

      return { ...e, compatible, compatLabel }
    })
    .sort((a: any, b: any) => (b.compatible ? 1 : 0) - (a.compatible ? 1 : 0))

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
    setGoals((prev) =>
      prev.map((g) => ({
        ...g,
        fieldTargets: g.fieldTargets?.filter((t) => t.fieldKey !== key),
      })),
    )
  }

  const saveGoal = () => {
    if (!editingGoal || !editingGoal.description.trim()) return
    const goal = draftToGoal(editingGoal)
    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.id === goal.id)
      if (idx >= 0) return prev.map((g, i) => (i === idx ? goal : g))
      return [...prev, goal]
    })
    setEditingGoal(null)
  }

  const removeGoal = (id: string) => setGoals((prev) => prev.filter((g) => g.id !== id))

  const enabledFields = trackingFields.filter((f) => f.enabled)
  const enabledNumberFields = enabledFields.filter((f) => f.type === 'number')
  const enabledFieldsCount = enabledFields.length
  const activeGoals = goals.filter((g) => !g.completedAt)
  const completedGoals = goals.filter((g) => !!g.completedAt)

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

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      categoryTag: categoryTag.trim() || undefined,
      frequency,
      daysOfWeek: frequency === 'days_of_week' ? daysOfWeek : undefined,
      repeatEveryDays: frequency === 'every_x_days' ? repeatEveryDays : undefined,
      timesPerWeek: frequency === 'times_per_week' ? timesPerWeek : undefined,
      startDate: startDate || undefined,
      trackingFields,
      goals: goals.length > 0 ? goals : [],
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
                { value: 'every_x_days', label: 'Every X days' },
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
          {frequency === 'every_x_days' && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-muted-foreground">Repeat every</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRepeatEveryDays((v: number) => Math.max(2, v + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold">{repeatEveryDays}</span>
                <button
                  type="button"
                  onClick={() => setRepeatEveryDays((v: number) => Math.max(2, v - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-muted-foreground">days</span>
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
                          <div className="flex-1 min-w-0">
                            <span className="block truncate font-medium text-foreground">
                              {e.title}
                            </span>
                            <span
                              className={cn(
                                'text-[10px]',
                                e.compatible ? 'text-emerald-500' : 'text-amber-500',
                              )}
                            >
                              {e.compatLabel}
                            </span>
                          </div>
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
        title="Goals"
        icon={Target}
        open={goalOpen}
        onToggle={() => setGoalOpen((v) => !v)}
        badge={goals.length > 0 ? String(goals.length) : 'Optional'}
      >
        <p className="text-xs text-muted-foreground">
          Add goals to track your progress and stay motivated.
        </p>

        {activeGoals.length > 0 && !editingGoal && (
          <div className="space-y-1.5">
            {activeGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-3 py-2.5"
              >
                <Trophy className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{goal.description}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {goal.type === 'manual'
                      ? 'Manual'
                      : `Field target${goal.endOnReach ? ' · ends on reach' : ' · milestone'}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingGoal(draftFromGoal(goal))}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors p-0.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeGoal(goal.id)}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {completedGoals.length > 0 && !editingGoal && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/40">
              Completed
            </p>
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-2 rounded-xl border border-border/30 bg-muted/20 px-3 py-2 opacity-60"
              >
                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                <p className="flex-1 text-xs text-muted-foreground truncate line-through">
                  {goal.description}
                </p>
                <button
                  type="button"
                  onClick={() => removeGoal(goal.id)}
                  className="text-muted-foreground/30 hover:text-destructive transition-colors p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {editingGoal && (
          <GoalForm
            draft={editingGoal}
            enabledNumberFields={enabledNumberFields}
            onChange={setEditingGoal}
            onSave={saveGoal}
            onCancel={() => setEditingGoal(null)}
          />
        )}

        {!editingGoal && (
          <button
            type="button"
            onClick={() => setEditingGoal(emptyGoalDraft())}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-border/60 px-3 py-1 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-all"
          >
            <Plus className="h-3 w-3" />
            Add goal
          </button>
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
