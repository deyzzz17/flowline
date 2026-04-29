'use client'

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCalendar, type CalendarView } from '@/hooks/calendar/use-calendar'
import { CalendarMonthView } from './calendar-month-view'
import { CalendarWeekView } from './calendar-week-view'
import { CalendarDayView } from './calendar-day-view'
import { CalendarEventDialog } from './calendar-event-dialog'
import type { CalendarEventData } from '@/api/calendar/actions'

const VIEW_LABELS: Record<CalendarView, string> = {
  month: 'Month',
  week: 'Week',
  day: 'Day',
}

function getHeaderTitle(date: Date, view: CalendarView): string {
  switch (view) {
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

export function CalendarClient() {
  const {
    view,
    setView,
    currentDate,
    navigate,
    getItemsForDate,
    selectedItem,
    dialogOpen,
    setDialogOpen,
    newEventDate,
    openNewEvent,
    openEdit,
    moveEvent,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useCalendar()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const item = active.data.current?.item
    if (!item || item.type !== 'event') return

    const newDate = new Date(over.id as string)
    moveEvent(item.id, newDate)
  }

  const handleSave = (data: CalendarEventData) => {
    if (selectedItem?.type === 'event') {
      updateMutation.mutate({ id: selectedItem.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-b border-border/40 bg-background/95 backdrop-blur-sm">
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
              {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
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
          </div>
        </div>

        {view === 'month' && (
          <CalendarMonthView
            currentDate={currentDate}
            getItemsForDate={getItemsForDate}
            onClickDay={openNewEvent}
            onClickItem={openEdit}
          />
        )}
        {view === 'week' && (
          <CalendarWeekView
            currentDate={currentDate}
            getItemsForDate={getItemsForDate}
            onClickSlot={openNewEvent}
            onClickItem={openEdit}
          />
        )}
        {view === 'day' && (
          <CalendarDayView
            currentDate={currentDate}
            getItemsForDate={getItemsForDate}
            onClickSlot={openNewEvent}
            onClickItem={openEdit}
          />
        )}
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
