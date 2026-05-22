'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useCalendar,
  type CalendarView,
  type CalendarTask,
  type CalendarItem,
  type CalendarEvent,
} from '@/hooks/calendar/use-calendar'
import { CalendarMonthView } from './calendar-month-view'
import { CalendarWeekView } from './calendar-week-view'
import { CalendarDayView } from './calendar-day-view'
import { CalendarYearView } from './calendar-year-view'
import { CalendarEventDialog } from './calendar-event-dialog'
import { TaskTimePicker } from './task-time-picker'
import type { CalendarEventData, EditScope } from '@/api/calendar/actions'
import { GoogleCalendarDialog } from './google-calendar-dialog'
import { useGoogleCalendar } from '@/hooks/calendar/use-google-calendar'
import { GoogleIcon } from '../icons/google-icon'

const VIEW_LABELS: Record<CalendarView, string> = {
  year: 'Year',
  month: 'Month',
  week: 'Week',
  day: 'Day',
}

function getHeaderTitle(date: Date, view: CalendarView): string {
  switch (view) {
    case 'year':
      return String(date.getFullYear())
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    case 'week': {
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
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
  }
}

function MoveScopeDialog({
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

type PendingMove = { type: 'move'; item: CalendarEvent; targetDate: Date }
type PendingResize = { type: 'resize'; item: CalendarEvent; newEndDate: Date }
type PendingAction = PendingMove | PendingResize

export function CalendarClient() {
  const {
    view,
    setView,
    currentDate,
    setCurrentDate,
    navigate,
    getItemsForDate,
    getItemDisplayHeight,
    selectedItem,
    dialogOpen,
    setDialogOpen,
    newEventDate,
    openNewEvent,
    openEdit,
    moveEvent,
    moveTask,
    resizeEvent,
    resizeTask,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useCalendar()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const [pendingTaskDrop, setPendingTaskDrop] = useState<{
    task: CalendarTask
    targetDate: Date
  } | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const goToDay = useCallback(
    (date: Date) => {
      setCurrentDate(date)
      setView('day')
    },
    [setCurrentDate, setView],
  )
  const goToMonth = useCallback(
    (date: Date) => {
      setCurrentDate(date)
      setView('month')
    },
    [setCurrentDate, setView],
  )

  const { isConnected } = useGoogleCalendar()
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false)

  const isRecurringEvent = (item: CalendarItem): item is CalendarEvent => {
    if (item.type !== 'event') return false
    const ev = item as CalendarEvent
    return !!(ev.recurrence?.frequency || ev.isOccurrence)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const item = active.data.current?.item
    if (!item) return

    // Bloque les events Google (read-only)
    if (item.source === 'google') return

    const targetDate = new Date(over.id as string)
    const hasSpecificHour = targetDate.getHours() !== 0 || targetDate.getMinutes() !== 0

    if (item.type === 'event') {
      if (isRecurringEvent(item)) {
        setPendingAction({ type: 'move', item: item as CalendarEvent, targetDate })
      } else {
        moveEvent(item.id as number, targetDate)
      }
    } else if (item.type === 'task') {
      if (view === 'day' && hasSpecificHour) moveTask(item.id as number, targetDate)
      else setPendingTaskDrop({ task: item as CalendarTask, targetDate })
    }
  }

  const handleResizeEnd = (item: CalendarItem, newEndDate: Date) => {
    if (item.type === 'event') {
      // Bloque les events Google (read-only)
      if ((item as CalendarEvent).source === 'google') return

      if (isRecurringEvent(item as CalendarEvent)) {
        setPendingAction({ type: 'resize', item: item as CalendarEvent, newEndDate })
      } else {
        resizeEvent(item.id as number, newEndDate)
        if (view === 'day') {
          const midnight = new Date(currentDate)
          midnight.setHours(24, 0, 0, 0)
          if (newEndDate > midnight) setTimeout(() => navigate('next'), 400)
        }
      }
    } else {
      resizeTask(item.id as number, newEndDate)
    }
  }

  const handleScopeSelect = (scope: EditScope) => {
    if (!pendingAction) return
    const { item } = pendingAction
    const occDate = item.occurrenceDate ?? item.startDate
    const key = item.optimisticKey

    if (pendingAction.type === 'move') {
      moveEvent(item.id as number, pendingAction.targetDate, scope, occDate, key)
    } else {
      resizeEvent(item.id as number, pendingAction.newEndDate, scope, occDate, key)
      if (view === 'day') {
        const midnight = new Date(currentDate)
        midnight.setHours(24, 0, 0, 0)
        if (pendingAction.newEndDate > midnight) setTimeout(() => navigate('next'), 400)
      }
    }
    setPendingAction(null)
  }

  const handleTaskTimeConfirm = (dateWithTime: Date) => {
    if (!pendingTaskDrop) return
    moveTask(pendingTaskDrop.task.id, dateWithTime)
    setPendingTaskDrop(null)
  }

  const handleSave = (data: CalendarEventData, scope?: EditScope, originalDate?: string) => {
    if (selectedItem?.type === 'event') {
      // Les events Google sont read-only
      if ((selectedItem as CalendarEvent).source === 'google') return
      updateMutation.mutate({
        id: selectedItem.id as number,
        data,
        scope,
        originalDate,
      })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: number, scope?: EditScope, originalDate?: string) => {
    deleteMutation.mutate({ id, scope, originalDate })
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <TaskTimePicker
        key={pendingTaskDrop?.targetDate.toISOString()}
        open={pendingTaskDrop !== null}
        date={pendingTaskDrop?.targetDate ?? null}
        taskTitle={pendingTaskDrop?.task.title ?? ''}
        onConfirm={handleTaskTimeConfirm}
        onCancel={() => setPendingTaskDrop(null)}
      />

      <MoveScopeDialog
        open={pendingAction !== null}
        onOpenChange={(v) => {
          if (!v) setPendingAction(null)
        }}
        onSelect={handleScopeSelect}
        action={pendingAction?.type === 'resize' ? 'resize' : 'move'}
      />

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-b border-border/40 bg-background/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('today')}
              className="h-8 text-xs"
            >
              Today
            </Button>
            <h2 className="text-sm font-semibold text-foreground">
              {getHeaderTitle(currentDate, view)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
              {(['year', 'month', 'week', 'day'] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
                    view === v
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => openNewEvent(new Date())}
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New event
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGoogleDialogOpen(true)}
              className="h-8 gap-1.5 text-xs"
            >
              <GoogleIcon className="h-3.5 w-3.5" />
              {isConnected ? 'Google Calendar' : 'Connect Google'}
            </Button>

            <GoogleCalendarDialog open={googleDialogOpen} onOpenChange={setGoogleDialogOpen} />
          </div>
        </div>

        <div
          className={cn(
            'flex-1 min-h-0',
            view === 'month' && 'overflow-auto',
            view === 'year' && 'overflow-hidden flex flex-col',
            (view === 'week' || view === 'day') && 'overflow-hidden flex flex-col',
          )}
        >
          {view === 'year' && (
            <CalendarYearView
              currentDate={currentDate}
              getItemsForDate={getItemsForDate}
              onClickDay={goToDay}
              onClickMonth={goToMonth}
            />
          )}
          {view === 'month' && (
            <CalendarMonthView
              currentDate={currentDate}
              getItemsForDate={getItemsForDate}
              onClickDay={goToDay}
              onClickCell={goToDay}
              onClickItem={openEdit}
              onDoubleClickDay={openNewEvent}
            />
          )}
          {view === 'week' && (
            <CalendarWeekView
              currentDate={currentDate}
              getItemsForDate={getItemsForDate}
              onClickSlot={goToDay}
              onClickItem={openEdit}
              onResizeEnd={handleResizeEnd}
              getItemDisplayHeight={getItemDisplayHeight}
              onDoubleClickSlot={openNewEvent}
            />
          )}
          {view === 'day' && (
            <CalendarDayView
              currentDate={currentDate}
              getItemsForDate={getItemsForDate}
              onClickSlot={openNewEvent}
              onClickItem={openEdit}
              onResizeEnd={handleResizeEnd}
              getItemDisplayHeight={getItemDisplayHeight}
            />
          )}
        </div>
      </div>

      <CalendarEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedItem={selectedItem}
        defaultDate={newEventDate}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={createMutation.isPending || updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />
    </DndContext>
  )
}