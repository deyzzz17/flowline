'use client'

import { useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CalendarEventBlock, pxToMinutes } from './calendar-event-block'
import { useTimeFormat } from '@/hooks/calendar/use-time-format'
import type { CalendarItem } from '@/hooks/calendar/use-calendar'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SLOT_HEIGHT = 56

function getWeekDays(currentDate: Date): Date[] {
  const start = new Date(currentDate)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
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

function getSlotDate(date: Date, clientY: number, rect: DOMRect): Date {
  const y = clientY - rect.top
  const totalMinutes = Math.floor(pxToMinutes(y) / 15) * 15
  const slotDate = new Date(date)
  slotDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0)
  return slotDate
}

function DayColumn({
  date,
  items,
  onClickSlot,
  onDoubleClickSlot,
  onClickItem,
  onResizeEnd,
  getItemDisplayHeight,
}: {
  date: Date
  items: CalendarItem[]
  onClickSlot: (date: Date) => void
  onDoubleClickSlot: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
  onResizeEnd: (item: CalendarItem, newEndDate: Date) => void
  getItemDisplayHeight: (item: CalendarItem) => number
}) {
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  return (
    <div
      className="relative border-r border-border/40"
      style={{ height: SLOT_HEIGHT * 24 }}
      onClick={(e) => {
        if (clickTimer.current) return
        const slotDate = getSlotDate(date, e.clientY, e.currentTarget.getBoundingClientRect())
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null
          onClickSlot(slotDate)
        }, 200)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (clickTimer.current) {
          clearTimeout(clickTimer.current)
          clickTimer.current = null
        }
        const slotDate = getSlotDate(date, e.clientY, e.currentTarget.getBoundingClientRect())
        onDoubleClickSlot(slotDate)
      }}
    >
      {HOURS.map((h) => (
        <DroppableSlot key={h} date={date} hour={h} />
      ))}
      {items.map((item) => (
        <CalendarEventBlock
          key={`${item.type}-${item.id}`}
          item={item}
          onClickItem={onClickItem}
          onResizeEnd={onResizeEnd}
          paddingX={2}
          displayHeight={getItemDisplayHeight(item)}
        />
      ))}
    </div>
  )
}

interface CalendarWeekViewProps {
  currentDate: Date
  getItemsForDate: (date: Date) => CalendarItem[]
  onClickSlot: (date: Date) => void
  onDoubleClickSlot: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
  onResizeEnd: (item: CalendarItem, newEndDate: Date) => void
  getItemDisplayHeight: (item: CalendarItem) => number
}

export function CalendarWeekView({
  currentDate,
  getItemsForDate,
  onClickSlot,
  onDoubleClickSlot,
  onClickItem,
  onResizeEnd,
  getItemDisplayHeight,
}: CalendarWeekViewProps) {
  const days = getWeekDays(currentDate)
  const today = new Date()
  const { formatHourLabel } = useTimeFormat()

  return (
    <div className="flex flex-1 overflow-auto">
      <div className="w-14 shrink-0 border-r border-border/40 relative">
        <div className="h-12 sticky top-0 z-20 bg-background border-b border-border/40" />
        <div className="relative" style={{ height: SLOT_HEIGHT * 24 }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute right-0 flex items-start justify-end pr-2"
              style={{ top: h * SLOT_HEIGHT - 8, height: SLOT_HEIGHT }}
            >
              {h !== 0 && (
                <span className="text-[10px] text-muted-foreground/50">{formatHourLabel(h)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-w-0">
        {days.map((date) => {
          const isToday = date.toDateString() === today.toDateString()
          const items = getItemsForDate(date)
          return (
            <div key={date.toISOString()} className="flex-1 flex flex-col min-w-0">
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm h-12 flex flex-col items-center justify-center border-b border-border/40 border-r border-border/40 shrink-0">
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
              <DayColumn
                date={date}
                items={items}
                onClickSlot={onClickSlot}
                onDoubleClickSlot={onDoubleClickSlot}
                onClickItem={onClickItem}
                onResizeEnd={onResizeEnd}
                getItemDisplayHeight={getItemDisplayHeight}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
