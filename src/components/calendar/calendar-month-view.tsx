'use client'

import { useRef } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CalendarItemPill } from './calendar-item-pill'
import { usePublicHolidays } from '@/hooks/calendar/use-public-holidays'
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
  holidayName?: string
  onClickDay: (date: Date) => void
  onClickCell: (date: Date) => void
  onDoubleClickDay: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
}

function DayCell({
  date,
  items,
  isCurrentMonth,
  isToday,
  holidayName,
  onClickDay,
  onClickCell,
  onDoubleClickDay,
  onClickItem,
}: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: date.toISOString() })
  const visible = items.slice(0, MAX_VISIBLE)
  const overflow = items.length - MAX_VISIBLE
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoliday = !!holidayName

  return (
    <div
      ref={setNodeRef}
      onClick={() => {
        if (clickTimer.current) return
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null
          onClickCell(date)
        }, 200)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (clickTimer.current) {
          clearTimeout(clickTimer.current)
          clickTimer.current = null
        }
        onDoubleClickDay(date)
      }}
      className={cn(
        'min-h-25 p-1.5 border-b border-r border-border/40 cursor-pointer transition-colors',
        !isCurrentMonth && 'bg-muted/20',
        isHoliday && isCurrentMonth && 'bg-amber-500/5',
        isOver && 'bg-violet-500/5 ring-1 ring-inset ring-violet-500/20',
        'hover:bg-muted/30',
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClickDay(date)
          }}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors hover:bg-muted',
            isToday
              ? 'bg-violet-600 text-white hover:bg-violet-700'
              : isHoliday && isCurrentMonth
                ? 'text-amber-600 dark:text-amber-400'
                : isCurrentMonth
                  ? 'text-foreground'
                  : 'text-muted-foreground/40',
          )}
        >
          {date.getDate()}
        </button>
      </div>

      {isHoliday && isCurrentMonth && (
        <p className="text-[9px] font-medium text-amber-600 dark:text-amber-400 truncate px-0.5 mb-0.5 leading-tight">
          {holidayName}
        </p>
      )}

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
  onClickCell: (date: Date) => void
  onDoubleClickDay: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
}

export function CalendarMonthView({
  currentDate,
  getItemsForDate,
  onClickDay,
  onClickCell,
  onDoubleClickDay,
  onClickItem,
}: CalendarMonthViewProps) {
  const days = getDaysInView(currentDate)
  const today = new Date()
  const { getHoliday } = usePublicHolidays(currentDate.getFullYear())

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
        {days.map((date) => {
          const holiday = getHoliday(date)
          return (
            <DayCell
              key={date.toISOString()}
              date={date}
              items={getItemsForDate(date)}
              isCurrentMonth={date.getMonth() === currentDate.getMonth()}
              isToday={date.toDateString() === today.toDateString()}
              holidayName={holiday?.localName}
              onClickDay={onClickDay}
              onClickCell={onClickCell}
              onDoubleClickDay={onDoubleClickDay}
              onClickItem={onClickItem}
            />
          )
        })}
      </div>
    </div>
  )
}
