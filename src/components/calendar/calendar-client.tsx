'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useCalendar,
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
import { HabitCalendarDialog } from './habit-calendar-dialog'
import {
  VIEW_LABELS,
  getHeaderTitle,
  useIsMobile,
  MoveScopeDialog,
  type PendingAction,
} from './calendar-shared'
import type { CalendarView } from '@/hooks/calendar/calendar-utils'

export function CalendarClient() {
  const {
    view,
    setView,
    currentDate,
    navigate,
    goToDay,
    goToMonth,
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

  const isMobile = useIsMobile()

  const handleNavigate = (dir: 'prev' | 'next' | 'today') => {
    if (isMobile && view === 'week' && dir !== 'today') {
      navigate(dir === 'prev' ? 'prev3' : 'next3')
    } else {
      navigate(dir)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
  )

  const [pendingTaskDrop, setPendingTaskDrop] = useState<{
    task: CalendarTask
    targetDate: Date
  } | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const { isConnected } = useGoogleCalendar()
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false)

  const [habitDialog, setHabitDialog] = useState<{
    open: boolean
    habitId: number
    habitSlug: string
    habitName: string
    habitColor: string
    habitDescription?: string | null
    startDate: string
    endDate: string
  } | null>(null)

  const handleClickItem = useCallback(
    (item: CalendarItem) => {
      if (item.type === 'event') {
        const ev = item as CalendarEvent
        if ((ev as any).source === 'habit') {
          setHabitDialog({
            open: true,
            habitId: (ev as any).habitId,
            habitSlug: (ev as any).habitSlug,
            habitName: ev.title,
            habitColor: ev.color,
            habitDescription: ev.description ?? null,
            startDate: ev.startDate,
            endDate: ev.endDate,
          })
          return
        }
      }
      openEdit(item)
    },
    [openEdit],
  )

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
    if (item.source === 'google' || item.source === 'habit') return
    if (item.type === 'event' && item.isMeeting) {
      toast.info('Meetings are changed from the meeting scheduler', {
        description: 'Open the meeting and use “Edit meeting” to pick a new slot with everyone.',
      })
      return
    }

    const targetDate = new Date(over.id as string)
    const hasSpecificHour = targetDate.getHours() !== 0 || targetDate.getMinutes() !== 0

    if (item.type === 'event') {
      if (isRecurringEvent(item)) {
        setPendingAction({ type: 'move', item: item as CalendarEvent, targetDate })
      } else {
        moveEvent(item.id as number, targetDate)
      }
    } else if (item.type === 'task') {
      const task = item as CalendarTask
      // Same day: only the time changes (or nothing, when dropped on a day
      // cell without a time) — no need to confirm. A new day asks for the
      // due time.
      const due = new Date(task.dueDate)
      const sameDay =
        due.getFullYear() === targetDate.getFullYear() &&
        due.getMonth() === targetDate.getMonth() &&
        due.getDate() === targetDate.getDate()
      if (sameDay) {
        if (hasSpecificHour) moveTask(task.id, targetDate)
      } else {
        setPendingTaskDrop({ task, targetDate })
      }
    }
  }

  const handleResizeEnd = (item: CalendarItem, newEndDate: Date) => {
    if (item.type === 'event') {
      if ((item as CalendarEvent).source === 'google') return
      if ((item as any).source === 'habit') return
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
    console.log('[handleScopeSelect]', { scope, pendingAction })
    if (!pendingAction) return
    const { item } = pendingAction
    const occDate = item.occurrenceDate ?? item.originalDate ?? item.startDate
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
      if ((selectedItem as CalendarEvent).source === 'google') return
      updateMutation.mutate({ id: selectedItem.id as number, data, scope, originalDate })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: number, scope?: EditScope, originalDate?: string) => {
    deleteMutation.mutate({ id, scope, originalDate })
  }

  const headerTitle = getHeaderTitle(currentDate, view, isMobile)

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
        <div className="flex items-center justify-between px-3 py-2 sm:px-6 sm:py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm shrink-0 gap-2">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => handleNavigate('prev')}
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => handleNavigate('next')}
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate('today')}
              className="h-7 sm:h-8 text-xs px-2 sm:px-3"
            >
              Today
            </Button>
            <h2 className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">
              {headerTitle}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-0.5 sm:p-1">
              {(['year', 'month', 'week', 'day'] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    'rounded-lg text-xs font-medium transition-all duration-150',
                    isMobile ? 'px-1.5 py-1' : 'px-3 py-1.5',
                    view === v
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {isMobile ? VIEW_LABELS[v][0] : VIEW_LABELS[v]}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => openNewEvent(new Date())}
              className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-xs px-2 sm:px-3"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New event</span>
            </Button>

            {isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setGoogleDialogOpen(true)}
                    className="gap-2 text-xs"
                  >
                    <GoogleIcon className="h-3.5 w-3.5" />
                    {isConnected ? 'Google Calendar' : 'Connect Google'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGoogleDialogOpen(true)}
                className="h-8 gap-1.5 text-xs"
              >
                <GoogleIcon className="h-3.5 w-3.5" />
                {isConnected ? 'Google Calendar' : 'Connect Google'}
              </Button>
            )}

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
              onClickItem={handleClickItem}
              onDoubleClickDay={openNewEvent}
              isMobile={isMobile}
            />
          )}
          {view === 'week' && (
            <CalendarWeekView
              currentDate={currentDate}
              getItemsForDate={getItemsForDate}
              onClickSlot={goToDay}
              onClickItem={handleClickItem}
              onResizeEnd={handleResizeEnd}
              getItemDisplayHeight={getItemDisplayHeight}
              onDoubleClickSlot={openNewEvent}
              isMobile={isMobile}
            />
          )}
          {view === 'day' && (
            <CalendarDayView
              currentDate={currentDate}
              getItemsForDate={getItemsForDate}
              onClickSlot={openNewEvent}
              onClickItem={handleClickItem}
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

      {habitDialog && (
        <HabitCalendarDialog
          open={habitDialog.open}
          habitId={habitDialog.habitId}
          habitSlug={habitDialog.habitSlug}
          habitName={habitDialog.habitName}
          habitColor={habitDialog.habitColor}
          habitDescription={habitDialog.habitDescription}
          startDate={habitDialog.startDate}
          endDate={habitDialog.endDate}
          onClose={() => setHabitDialog(null)}
        />
      )}
    </DndContext>
  )
}
