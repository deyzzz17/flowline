'use client'

import { useDroppable, useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CalendarItemPill } from './calendar-item-pill'
import type { CalendarItem } from '@/hooks/calendar/use-calendar'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function HourSlot({
  date,
  hour,
  items,
  onClickSlot,
  onClickItem,
}: {
  date: Date
  hour: number
  items: CalendarItem[]
  onClickSlot: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
}) {
  const slotDate = new Date(date)
  slotDate.setHours(hour, 0, 0, 0)
  const { setNodeRef, isOver } = useDroppable({ id: slotDate.toISOString() })

  return (
    <div className="flex border-b border-border/20">
      <div className="w-16 shrink-0 flex items-start justify-end pr-3 pt-1">
        <span className="text-[11px] text-muted-foreground/50">
          {hour === 0
            ? '12 am'
            : hour < 12
              ? `${hour} am`
              : hour === 12
                ? '12 pm'
                : `${hour - 12} pm`}
        </span>
      </div>

      <div
        ref={setNodeRef}
        onClick={() => onClickSlot(slotDate)}
        className={cn(
          'flex-1 min-h-[64px] px-2 py-1 cursor-pointer transition-colors',
          isOver && 'bg-violet-500/5',
          'hover:bg-muted/20',
        )}
      >
        {items.map((item) => (
          <DraggableItem key={`${item.type}-${item.id}`} item={item} onClickItem={onClickItem} />
        ))}
      </div>
    </div>
  )
}

function DraggableItem({
  item,
  onClickItem,
}: {
  item: CalendarItem
  onClickItem: (item: CalendarItem) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${item.type}-${item.id}`,
    data: { item },
    disabled: item.type === 'task',
  })

  return (
    <div ref={setNodeRef} {...(item.type === 'event' ? { ...listeners, ...attributes } : {})}>
      <CalendarItemPill item={item} onClick={() => onClickItem(item)} isDragging={isDragging} />
    </div>
  )
}

interface CalendarDayViewProps {
  currentDate: Date
  getItemsForDate: (date: Date) => CalendarItem[]
  onClickSlot: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
}

export function CalendarDayView({
  currentDate,
  getItemsForDate,
  onClickSlot,
  onClickItem,
}: CalendarDayViewProps) {
  const today = new Date()
  const isToday = currentDate.toDateString() === today.toDateString()

  const items = getItemsForDate(currentDate)

  const getItemsForHour = (hour: number): CalendarItem[] =>
    items.filter((item) => {
      const d = new Date(item.type === 'event' ? item.startDate : item.dueDate)
      return d.getHours() === hour
    })

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40">
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

      <div className="flex-1">
        {HOURS.map((h) => (
          <HourSlot
            key={h}
            date={currentDate}
            hour={h}
            items={getItemsForHour(h)}
            onClickSlot={onClickSlot}
            onClickItem={onClickItem}
          />
        ))}
      </div>
    </div>
  )
}
