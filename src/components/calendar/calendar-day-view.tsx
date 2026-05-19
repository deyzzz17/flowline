'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CalendarEventBlock, pxToMinutes } from './calendar-event-block'
import { computeColumns } from './calendar-columns'
import { useTimeFormat } from '@/hooks/calendar/use-time-format'
import { usePublicHolidays } from '@/hooks/calendar/use-public-holidays'
import type { CalendarItem, CalendarEvent } from '@/hooks/calendar/use-calendar'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_HEIGHT = 56
const PADDING = 4

function isAllDay(item: CalendarItem): boolean {
  return item.type === 'event' && (item as CalendarEvent).allDay
}

function AllDayPill({
  item,
  onClick,
}: {
  item: CalendarItem
  onClick: (item: CalendarItem) => void
}) {
  const event = item as CalendarEvent
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick(item)
      }}
      className="w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate transition-opacity hover:opacity-80"
      style={{
        backgroundColor: `${event.color}30`,
        color: event.color,
        borderLeft: `2px solid ${event.color}`,
      }}
    >
      {item.title}
    </button>
  )
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
  getItemDisplayHeight: (item: CalendarItem) => number
}

export function CalendarDayView({
  currentDate,
  getItemsForDate,
  onClickSlot,
  onClickItem,
  onResizeEnd,
  getItemDisplayHeight,
}: CalendarDayViewProps) {
  const today = new Date()
  const isToday = currentDate.toDateString() === today.toDateString()
  const allItems = getItemsForDate(currentDate)
  const allDayItems = allItems.filter(isAllDay)
  const timedItems = allItems.filter((i) => !isAllDay(i))
  const totalHeight = SLOT_HEIGHT * 24
  const { formatHourLabel } = useTimeFormat()
  const { getHoliday } = usePublicHolidays(currentDate.getFullYear())
  const holiday = getHoliday(currentDate)
  const layouts = computeColumns(timedItems)

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div
        className={cn(
          'flex items-center gap-3 px-6 py-4 border-b border-border/40 shrink-0',
          holiday && 'bg-amber-500/5',
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-semibold',
            isToday
              ? 'bg-violet-600 text-white'
              : holiday
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'bg-muted text-foreground',
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
          {holiday ? (
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {holiday.localName}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60">
              {allItems.length} event{allItems.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {allDayItems.length > 0 && (
        <div className="flex border-b border-border/40 shrink-0">
          <div className="w-16 shrink-0 flex items-center justify-end pr-3 border-r border-border/40">
            <span className="text-[9px] text-muted-foreground/40">all day</span>
          </div>
          <div className="flex-1 px-2 py-1.5 flex flex-col gap-0.5">
            {allDayItems.map((item) => (
              <AllDayPill key={`${item.type}-${item.id}`} item={item} onClick={onClickItem} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1">
        <div className="w-16 shrink-0 relative" style={{ height: totalHeight }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute right-0 flex items-start justify-end pr-3"
              style={{ top: h * SLOT_HEIGHT - 8, height: SLOT_HEIGHT }}
            >
              {h !== 0 && (
                <span className="text-[10px] text-muted-foreground/50">{formatHourLabel(h)}</span>
              )}
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
          {layouts.map(({ item, column, totalColumns }) => {
            const widthPct = 100 / totalColumns
            const leftPct = column * widthPct
            return (
              <CalendarEventBlock
                key={`${item.type}-${item.id}`}
                item={item}
                onClickItem={onClickItem}
                onResizeEnd={onResizeEnd}
                displayHeight={getItemDisplayHeight(item)}
                style={{
                  left: `calc(${leftPct}% + ${PADDING}px)`,
                  right: `calc(${100 - leftPct - widthPct}% + ${PADDING}px)`,
                  width: 'auto',
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
