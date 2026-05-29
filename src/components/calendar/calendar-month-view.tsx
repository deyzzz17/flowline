'use client'

import { useRef } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CalendarItemPill } from './calendar-item-pill'
import { usePublicHolidays } from '@/hooks/calendar/use-public-holidays'
import type { CalendarItem } from '@/hooks/calendar/use-calendar'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// Abréviations ultra-courtes pour mobile
const DAYS_MOBILE = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MAX_VISIBLE = 3
// Sur mobile on affiche moins d'events par cellule
const MAX_VISIBLE_MOBILE = 1

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
  isMobile?: boolean
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
  isMobile = false,
}: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: date.toISOString() })
  const maxVis = isMobile ? MAX_VISIBLE_MOBILE : MAX_VISIBLE
  const visible = items.slice(0, maxVis)
  const overflow = items.length - maxVis
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
        'border-b border-r border-border/40 cursor-pointer transition-colors',
        isMobile ? 'min-h-16 p-1' : 'min-h-25 p-1.5',
        !isCurrentMonth && 'bg-muted/20',
        isHoliday && isCurrentMonth && 'bg-amber-500/5',
        isOver && 'bg-violet-500/5 ring-1 ring-inset ring-violet-500/20',
        'hover:bg-muted/30',
      )}
    >
      <div className="flex items-center justify-between mb-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClickDay(date)
          }}
          className={cn(
            'flex items-center justify-center rounded-full font-medium transition-colors hover:bg-muted',
            isMobile ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs',
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

      {/* Holiday name — masqué sur mobile pour économiser l'espace */}
      {isHoliday && isCurrentMonth && !isMobile && (
        <p className="text-[9px] font-medium text-amber-600 dark:text-amber-400 truncate px-0.5 mb-0.5 leading-tight">
          {holidayName}
        </p>
      )}
      {/* Sur mobile : juste un dot amber pour le holiday */}
      {isHoliday && isCurrentMonth && isMobile && (
        <div className="flex justify-center mb-0.5">
          <span className="h-1 w-1 rounded-full bg-amber-500" />
        </div>
      )}

      <div className="space-y-0.5">
        {visible.map((item) => (
          <DraggableItem
            key={`${item.type}-${item.id}`}
            item={item}
            onClickItem={onClickItem}
            compact={isMobile}
          />
        ))}
        {overflow > 0 && (
          <p
            className={cn('text-muted-foreground/60 px-1', isMobile ? 'text-[9px]' : 'text-[10px]')}
          >
            +{overflow}
          </p>
        )}
      </div>
    </div>
  )
}

function DraggableItem({
  item,
  onClickItem,
  compact = false,
}: {
  item: CalendarItem
  onClickItem: (item: CalendarItem) => void
  compact?: boolean
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
  isMobile?: boolean
}

export function CalendarMonthView({
  currentDate,
  getItemsForDate,
  onClickDay,
  onClickCell,
  onDoubleClickDay,
  onClickItem,
  isMobile = false,
}: CalendarMonthViewProps) {
  const days = getDaysInView(currentDate)
  const today = new Date()
  const { getHoliday } = usePublicHolidays(currentDate.getFullYear())
  const dayLabels = isMobile ? DAYS_MOBILE : DAYS

  return (
    <div className="flex-1 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/40">
        {dayLabels.map((d, i) => (
          <div
            key={i}
            className={cn(
              'py-2 text-center font-semibold uppercase tracking-wide text-muted-foreground/60',
              isMobile ? 'text-[10px]' : 'text-xs',
            )}
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
              isMobile={isMobile}
            />
          )
        })}
      </div>
    </div>
  )
}
