'use client'

import { useDroppable, useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CalendarItemPill } from './calendar-item-pill'
import type { CalendarItem } from '@/hooks/calendar/use-calendar'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekDays(currentDate: Date): Date[] {
  const start = new Date(currentDate)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

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
    <div
      ref={setNodeRef}
      onClick={() => onClickSlot(slotDate)}
      className={cn(
        'h-14 border-b border-border/20 px-1 py-0.5 cursor-pointer transition-colors',
        isOver && 'bg-violet-500/5 ring-1 ring-inset ring-violet-500/20',
        'hover:bg-muted/20',
      )}
    >
      {items.map((item) => (
        <DraggableItem key={`${item.type}-${item.id}`} item={item} onClickItem={onClickItem} />
      ))}
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
      <CalendarItemPill item={item} onClick={() => onClickItem(item)} isDragging={isDragging} />
    </div>
  )
}

interface CalendarWeekViewProps {
  currentDate: Date
  getItemsForDate: (date: Date) => CalendarItem[]
  onClickSlot: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
}

export function CalendarWeekView({
  currentDate,
  getItemsForDate,
  onClickSlot,
  onClickItem,
}: CalendarWeekViewProps) {
  const days = getWeekDays(currentDate)
  const today = new Date()

  const getItemsForHour = (date: Date, hour: number): CalendarItem[] =>
    getItemsForDate(date).filter((item) => {
      const itemDate = new Date(item.type === 'event' ? item.startDate : item.dueDate)
      return itemDate.getHours() === hour
    })

  return (
    <div className="flex flex-1 overflow-auto">
      <div className="w-14 shrink-0 border-r border-border/40">
        <div className="h-12" />
        {HOURS.map((h) => (
          <div key={h} className="h-14 flex items-start justify-end pr-2 pt-1">
            <span className="text-[10px] text-muted-foreground/50">
              {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-1 min-w-0">
        {days.map((date) => {
          const isToday = date.toDateString() === today.toDateString()
          return (
            <div key={date.toISOString()} className="flex-1 border-r border-border/40 min-w-0">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm h-12 flex flex-col items-center justify-center border-b border-border/40">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                  {DAYS_SHORT[date.getDay()]}
                </span>
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                    isToday ? 'bg-violet-600 text-white' : 'text-foreground',
                  )}
                >
                  {date.getDate()}
                </span>
              </div>

              {HOURS.map((h) => (
                <HourSlot
                  key={h}
                  date={date}
                  hour={h}
                  items={getItemsForHour(date, h)}
                  onClickSlot={onClickSlot}
                  onClickItem={onClickItem}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
