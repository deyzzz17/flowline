'use client'

import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { EditScope } from '@/api/calendar/actions'
import type { CalendarEvent, CalendarView } from '@/hooks/calendar/calendar-utils'

export const VIEW_LABELS: Record<CalendarView, string> = {
  year: 'Year',
  month: 'Month',
  week: 'Week',
  day: 'Day',
}

export function getHeaderTitle(date: Date, view: CalendarView, isMobile: boolean): string {
  switch (view) {
    case 'year':
      return String(date.getFullYear())
    case 'month':
      return isMobile
        ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    case 'week': {
      if (isMobile) {
        const start = new Date(date)
        start.setDate(start.getDate() - 1)
        const end = new Date(date)
        end.setDate(end.getDate() + 1)
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { day: 'numeric' })}`
      }
      const start = new Date(date)
      start.setDate(start.getDate() - start.getDay())
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`
      }
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    case 'day':
      return isMobile
        ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        : date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
  }
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

export type PendingMove = { type: 'move'; item: CalendarEvent; targetDate: Date }
export type PendingResize = { type: 'resize'; item: CalendarEvent; newEndDate: Date }
export type PendingAction = PendingMove | PendingResize

export function MoveScopeDialog({
  open,
  onOpenChange,
  onSelect,
  action,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelect: (scope: EditScope) => void
  action: 'move' | 'resize'
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === 'move' ? 'Move recurring event' : 'Resize recurring event'}
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
