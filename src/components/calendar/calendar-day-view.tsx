'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CalendarEventBlock, pxToMinutes } from './calendar-event-block'
import type { CalendarItem } from '@/hooks/calendar/use-calendar'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_HEIGHT = 56

function formatHour(h: number) {
  if (h === 0) return '12 am'
  if (h < 12) return `${h} am`
  if (h === 12) return '12 pm'
  return `${h - 12} pm`
}

function DroppableSlot({ date, hour }: { date: Date; hour: number }) {
  const slotDate = new Date(date)
  slotDate.setHours(hour, 0, 0, 0)
  const { setNodeRef, isOver } = useDroppable({ id: slotDate.toISOString() })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-0 right-0 border-b border-border/20 pointer-events-auto transition-colors',
        isOver && 'bg-violet-500/5',
      )}
      style={{ top: hour * SLOT_HEIGHT, height: SLOT_HEIGHT }}
    />
  )
}

interface CalendarDayViewProps {
  currentDate: Date
  getItemsForDate: (date: Date) => CalendarItem[]
  onClickSlot: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
  onResizeEnd: (item: CalendarItem, newEndDate: Date) => void
}

export function CalendarDayView({
  currentDate,
  getItemsForDate,
  onClickSlot,
  onClickItem,
  onResizeEnd,
}: CalendarDayViewProps) {
  const today = new Date()
  const isToday = currentDate.toDateString() === today.toDateString()
  const items = getItemsForDate(currentDate)
  const totalHeight = SLOT_HEIGHT * 24

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 shrink-0">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-semibold',
            isToday ? 'bg-violet-600 text-white' : 'bg-muted text-foreground',
          )}
        >
          {currentDate.getDate()}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {items.length} event{items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="w-16 shrink-0 relative" style={{ height: totalHeight }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute right-0 flex items-start justify-end pr-3"
              style={{ top: h * SLOT_HEIGHT - 8, height: SLOT_HEIGHT }}
            >
              <span className="text-[11px] text-muted-foreground/50">{formatHour(h)}</span>
            </div>
          ))}
        </div>

        <div
          className="flex-1 relative cursor-pointer"
          style={{ height: totalHeight }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const y = e.clientY - rect.top
            const totalMinutes = Math.floor(pxToMinutes(y) / 15) * 15
            const slotDate = new Date(currentDate)
            slotDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0)
            onClickSlot(slotDate)
          }}
        >
          {HOURS.map((h) => (
            <DroppableSlot key={h} date={currentDate} hour={h} />
          ))}
          {items.map((item) => (
            <CalendarEventBlock
              key={`${item.type}-${item.id}`}
              item={item}
              onClickItem={onClickItem}
              onResizeEnd={onResizeEnd}
              paddingX={4}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
