'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalendarItem, CalendarEvent } from '@/hooks/calendar/use-calendar'
import type { CalendarEventData } from '@/api/calendar/actions'

const PRESET_COLORS = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
  '#10b981', '#f59e0b', '#ef4444', '#ec4899',
]

function formatDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
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
  open, onOpenChange, selectedItem, defaultDate,
  onSave, onDelete, isSaving, isDeleting,
}: CalendarEventDialogProps) {
  const isEvent = selectedItem?.type === 'event'
  const isTask = selectedItem?.type === 'task'
  const isEditing = isEvent

  const defaultStart = defaultDate ?? new Date()
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(formatDatetimeLocal(defaultStart))
  const [endDate, setEndDate] = useState(formatDatetimeLocal(defaultEnd))
  const [allDay, setAllDay] = useState(false)
  const [color, setColor] = useState('#8b5cf6')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (isEditing && selectedItem) {
      const ev = selectedItem as CalendarEvent
      setTitle(ev.title)
      setDescription(ev.description ?? '')
      setStartDate(formatDatetimeLocal(new Date(ev.startDate)))
      setEndDate(formatDatetimeLocal(new Date(ev.endDate)))
      setAllDay(ev.allDay)
      setColor(ev.color)
    } else {
      const start = defaultDate ?? new Date()
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      setTitle('')
      setDescription('')
      setStartDate(formatDatetimeLocal(start))
      setEndDate(formatDatetimeLocal(end))
      setAllDay(false)
      setColor('#8b5cf6')
    }
    setError(null)
  }, [open, selectedItem, defaultDate, isEditing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date')
      return
    }
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      allDay,
      color,
    })
  }

  if (isTask && selectedItem) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: (selectedItem as any).listColor }} />
              Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium text-foreground">{selectedItem.title}</p>
            <p className="text-xs text-muted-foreground">
              List: <span className="font-medium">{(selectedItem as any).listName}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Due: <span className="font-medium">{new Date((selectedItem as any).dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit event' : 'New event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm">Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); setError(null) }}
              placeholder="Event title..." className="h-10" autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Description <span className="text-xs font-normal text-muted-foreground ml-1">Optional</span></Label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              className="w-full min-h-20 resize-none rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary/40 placeholder:text-muted-foreground" />
          </div>

          <button type="button" onClick={() => setAllDay(!allDay)}
            className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3 transition-all hover:bg-muted/40">
            <p className="text-sm font-medium">All day</p>
            <div className={cn('relative h-5 w-9 rounded-full transition-colors', allDay ? 'bg-violet-500' : 'bg-muted-foreground/30')}>
              <span className={cn('absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', allDay ? 'translate-x-4' : 'translate-x-0')} />
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Start</Label>
              <input type={allDay ? 'date' : 'datetime-local'} value={allDay ? startDate.slice(0, 10) : startDate}
                onChange={(e) => setStartDate(allDay ? `${e.target.value}T00:00` : e.target.value)}
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40 transition-all" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">End</Label>
              <input type={allDay ? 'date' : 'datetime-local'} value={allDay ? endDate.slice(0, 10) : endDate}
                onChange={(e) => setEndDate(allDay ? `${e.target.value}T23:59` : e.target.value)}
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Color</Label>
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('h-6 w-6 rounded-full transition-all hover:scale-110', color === c && 'ring-2 ring-offset-2 ring-offset-background')}
                  style={{ backgroundColor: c, ...(color === c && { ringColor: c }) }} />
              ))}
              <div className="relative ml-1">
                <div className="h-6 w-6 rounded-full border-2 border-dashed border-border/60 cursor-pointer"
                  style={{ backgroundColor: PRESET_COLORS.includes(color) ? 'transparent' : color }} />
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full" />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 pt-1">
            {isEditing && (
              <Button type="button" variant="ghost" size="icon"
                onClick={() => selectedItem && onDelete(selectedItem.id)}
                disabled={isDeleting} className="text-destructive hover:text-destructive mr-auto">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</> : isEditing ? 'Save changes' : 'Create event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}