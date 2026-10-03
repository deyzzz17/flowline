'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  UsersRound,
} from 'lucide-react'
import { MeetingSchedulerDialog } from './meeting-scheduler-dialog'
import { useActiveWorkspace } from '@/components/dashboard/workspace-switcher'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTeams } from '@/hooks/teams/use-teams'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useWorkspaceCalendar,
} from '@/hooks/calendar/use-workspace-calendar'
import type { CalendarTask, CalendarItem, CalendarEvent } from '@/hooks/calendar/calendar-utils'
import { CalendarMonthView } from './calendar-month-view'
import { CalendarWeekView } from './calendar-week-view'
import { CalendarDayView } from './calendar-day-view'
import { CalendarYearView } from './calendar-year-view'
import { CalendarEventDialog } from './calendar-event-dialog'
import { TaskTimePicker } from './task-time-picker'
import type { CalendarEventData, EditScope } from '@/api/calendar/actions'
import {
  VIEW_LABELS,
  getHeaderTitle,
  useIsMobile,
  MoveScopeDialog,
  type PendingAction,
} from './calendar-shared'
import type { CalendarView } from '@/hooks/calendar/calendar-utils'

export function WorkspaceCalendarClient() {
  const {
    view,
    setView,
    calendarTeamId,
    setCalendarTeamId,
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
  } = useWorkspaceCalendar()

  const isMobile = useIsMobile()
  const { teams } = useTeams()
  const selectedTeam = teams.find((t) => t.id === calendarTeamId) ?? null
  const calendarLabel = selectedTeam ? selectedTeam.name : 'My agenda'
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  // Set when the scheduler is opened to change an existing meeting.
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null)
  // Viewers are read-only in a workspace — the server would refuse anyway.
  const canSchedule = useActiveWorkspace()?.myRole !== 'viewer'

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
            {/* Which calendar: the viewer's own agenda (their events + the
                ones assigned to them) or one team's calendar. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 sm:h-8 gap-1.5 text-xs px-2 sm:px-3 max-w-[140px] sm:max-w-[200px]"
                >
                  {selectedTeam ? (
                    <UsersRound className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <User className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{calendarLabel}</span>
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => setCalendarTeamId(null)}>
                  <User className="h-4 w-4" />
                  <span className="flex-1">My agenda</span>
                  {calendarTeamId === null && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                {teams.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Team calendars
                    </DropdownMenuLabel>
                    {teams.map((t) => (
                      <DropdownMenuItem key={t.id} onSelect={() => setCalendarTeamId(t.id)}>
                        <UsersRound className="h-4 w-4" />
                        <span className="flex-1 truncate">{t.name}</span>
                        {calendarTeamId === t.id && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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

            {canSchedule && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingMeetingId(null)
                  setSchedulerOpen(true)
                }}
                className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-xs px-2 sm:px-3"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Schedule meeting</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => openNewEvent(new Date())}
              className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-xs px-2 sm:px-3"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New event</span>
            </Button>
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
              isMobile={isMobile}
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
              isMobile={isMobile}
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
        allowTeamAssociation
        onEditMeeting={(eventId) => {
          setDialogOpen(false)
          setEditingMeetingId(eventId)
          setSchedulerOpen(true)
        }}
      />

      <MeetingSchedulerDialog
        open={schedulerOpen}
        onOpenChange={setSchedulerOpen}
        defaultDate={currentDate}
        onScheduled={goToDay}
        editEventId={editingMeetingId}
      />
    </DndContext>
  )
}
