'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HabitData, HabitWithStats } from '@/api/habits/actions'

const PRESET_COLORS = [
  '#f97316', '#ef4444', '#ec4899', '#8b5cf6',
  '#6366f1', '#3b82f6', '#0ea5e9', '#10b981',
  '#84cc16', '#f59e0b', '#14b8a6', '#64748b',
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

interface HabitFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: HabitData) => Promise<void>
  initialData?: HabitWithStats
}

export function HabitFormDialog({ open, onOpenChange, onSubmit, initialData }: HabitFormDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#f97316')
  const [categoryTag, setCategoryTag] = useState('')
  const [frequency, setFrequency] = useState<HabitData['frequency']>('daily')
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri'])
  const [timesPerWeek, setTimesPerWeek] = useState(3)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name)
      setDescription(initialData.description ?? '')
      setColor(initialData.color)
      setCategoryTag(initialData.categoryTag ?? '')
      setFrequency(initialData.frequency)
      setDaysOfWeek(initialData.daysOfWeek ?? ['mon', 'tue', 'wed', 'thu', 'fri'])
      setTimesPerWeek(initialData.timesPerWeek ?? 3)
    } else if (open && !initialData) {
      setName('')
      setDescription('')
      setColor('#f97316')
      setCategoryTag('')
      setFrequency('daily')
      setDaysOfWeek(['mon', 'tue', 'wed', 'thu', 'fri'])
      setTimesPerWeek(3)
    }
  }, [open, initialData])

  const toggleDay = (day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsPending(true)
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      categoryTag: categoryTag.trim() || undefined,
      frequency,
      daysOfWeek: frequency === 'days_of_week' ? daysOfWeek : undefined,
      timesPerWeek: frequency === 'times_per_week' ? timesPerWeek : undefined,
    })
    setIsPending(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit habit' : 'New habit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <div className="space-y-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning workout"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description <span className="text-xs font-normal text-muted-foreground">Optional</span></Label>
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
                  key={c} type="button" onClick={() => setColor(c)}
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
                  type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category <span className="text-xs font-normal text-muted-foreground">Optional</span></Label>
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
              {([
                { value: 'daily', label: 'Every day' },
                { value: 'days_of_week', label: 'Custom days' },
                { value: 'times_per_week', label: 'X per week' },
              ] as const).map((opt) => (
                <button
                  key={opt.value} type="button" onClick={() => setFrequency(opt.value)}
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
                    key={day.value} type="button" onClick={() => toggleDay(day.value)}
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
                    type="button" onClick={() => setTimesPerWeek((v) => Math.max(1, v - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
                  >−</button>
                  <span className="w-6 text-center text-sm font-semibold">{timesPerWeek}</span>
                  <button
                    type="button" onClick={() => setTimesPerWeek((v) => Math.min(7, v + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
                  >+</button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || isPending} className="gap-2">
              {isPending ? (
                <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />Saving...</>
              ) : (
                <><Check className="h-3.5 w-3.5" />{initialData ? 'Save changes' : 'Create habit'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}