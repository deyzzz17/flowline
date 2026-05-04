'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CalendarItemPill } from './calendar-item-pill'
import type { CalendarItem } from '@/hooks/calendar/use-calendar'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE = 3

function getDaysInView(currentDate: Date): Date[] {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const start = new Date(firstDay)
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(lastDay)
  end.setDate(end.getDate() + (6 - end.getDay()))
  const days: Date[] = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

interface DayCellProps {
  date: Date
  items: CalendarItem[]
  isCurrentMonth: boolean
  isToday: boolean
  onClickDay: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
}

function DayCell({ date, items, isCurrentMonth, isToday, onClickDay, onClickItem }: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: date.toISOString() })
  const visible = items.slice(0, MAX_VISIBLE)
  const overflow = items.length - MAX_VISIBLE

  return (
    <div
      ref={setNodeRef}
      onClick={() => onClickDay(date)}
      className={cn(
        'min-h-25 p-1.5 border-b border-r border-border/40 cursor-pointer transition-colors',
        !isCurrentMonth && 'bg-muted/20',
        isOver && 'bg-violet-500/5 ring-1 ring-inset ring-violet-500/20',
        'hover:bg-muted/30',
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
            isToday
              ? 'bg-violet-600 text-white'
              : isCurrentMonth
                ? 'text-foreground'
                : 'text-muted-foreground/40',
          )}
        >
          {date.getDate()}
        </span>
      </div>
      <div className="space-y-0.5">
        {visible.map((item) => (
          <DraggableItem key={`${item.type}-${item.id}`} item={item} onClickItem={onClickItem} />
        ))}
        {overflow > 0 && (
          <p className="text-[10px] text-muted-foreground/60 px-1.5">+{overflow} more</p>
        )}
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
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(isDragging && 'opacity-40')}
      onClick={(e) => e.stopPropagation()}
    >
      <CalendarItemPill
        item={item}
        onClick={() => onClickItem(item)}
        isDragging={isDragging}
        compact
      />
    </div>
  )
}

interface CalendarMonthViewProps {
  currentDate: Date
  getItemsForDate: (date: Date) => CalendarItem[]
  onClickDay: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
}

export function CalendarMonthView({
  currentDate,
  getItemsForDate,
  onClickDay,
  onClickItem,
}: CalendarMonthViewProps) {
  const days = getDaysInView(currentDate)
  const today = new Date()

  return (
    <div className="flex-1 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/40">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground/60"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => (
          <DayCell
            key={date.toISOString()}
            date={date}
            items={getItemsForDate(date)}
            isCurrentMonth={date.getMonth() === currentDate.getMonth()}
            isToday={date.toDateString() === today.toDateString()}
            onClickDay={onClickDay}
            onClickItem={onClickItem}
          />
        ))}
      </div>
    </div>
  )
}
