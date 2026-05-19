'use client'

import { useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CalendarEventBlock, pxToMinutes, getItemTop, getItemHeight, minutesToPx } from './calendar-event-block'
import { useTimeFormat } from '@/hooks/calendar/use-time-format'
import { usePublicHolidays } from '@/hooks/calendar/use-public-holidays'
import type { CalendarItem, CalendarEvent } from '@/hooks/calendar/use-calendar'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
// 96 slots de 15 minutes = 24h — granularité fine pour le drag
const SLOTS_COUNT = 96
const SLOTS = Array.from({ length: SLOTS_COUNT }, (_, i) => i)
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SLOT_HEIGHT = 56 // hauteur d'une heure en px
const SLOT_15_HEIGHT = SLOT_HEIGHT / 4 // hauteur d'un slot de 15min
const PADDING = 2

function getWeekDays(currentDate: Date): Date[] {
  const start = new Date(currentDate)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i); return d
  })
}

function isAllDay(item: CalendarItem): boolean {
  return item.type === 'event' && (item as CalendarEvent).allDay
}

function AllDayPill({ item, onClick }: { item: CalendarItem; onClick: (item: CalendarItem) => void }) {
  const event = item as CalendarEvent
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(item) }}
      className="w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate transition-opacity hover:opacity-80"
      style={{ backgroundColor: `${event.color}30`, color: event.color, borderLeft: `2px solid ${event.color}` }}>
      {item.title}
    </button>
  )
}

// Slot droppable de 15 minutes
function DroppableSlot({ date, slotIndex }: { date: Date; slotIndex: number }) {
  const slotDate = new Date(date)
  slotDate.setHours(Math.floor(slotIndex / 4), (slotIndex % 4) * 15, 0, 0)
  const { setNodeRef, isOver } = useDroppable({ id: slotDate.toISOString() })
  return (
    <div ref={setNodeRef}
      className={cn(
        'absolute left-0 right-0 pointer-events-auto transition-colors',
        isOver && 'bg-violet-500/5',
      )}
      style={{ top: slotIndex * SLOT_15_HEIGHT, height: SLOT_15_HEIGHT }}
    />
  )
}

// Lignes visuelles des heures (séparées des slots droppables)
function HourLines() {
  return (
    <>
      {HOURS.map((h) => (
        <div key={h} className="absolute left-0 right-0 border-b border-border/20 pointer-events-none"
          style={{ top: h * SLOT_HEIGHT, height: SLOT_HEIGHT }} />
      ))}
    </>
  )
}

function getSlotDate(date: Date, clientY: number, rect: DOMRect): Date {
  const y = clientY - rect.top
  const totalMinutes = Math.floor(pxToMinutes(y) / 15) * 15
  const slotDate = new Date(date)
  slotDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0)
  return slotDate
}

function computeColumnsForDay(items: CalendarItem[], viewDate: Date) {
  if (items.length === 0) return []
  const sorted = [...items].sort((a, b) => getItemTop(a, viewDate) - getItemTop(b, viewDate))
  const groups: CalendarItem[][] = []
  let currentGroup: CalendarItem[] = []
  let groupEnd = 0
  for (const item of sorted) {
    const top = getItemTop(item, viewDate)
    const end = top + getItemHeight(item, viewDate)
    if (currentGroup.length === 0 || top < groupEnd) {
      currentGroup.push(item); groupEnd = Math.max(groupEnd, end)
    } else {
      groups.push([...currentGroup]); currentGroup = [item]; groupEnd = end
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup)
  const result: { item: CalendarItem; column: number; totalColumns: number }[] = []
  for (const group of groups) {
    const columns: CalendarItem[][] = []
    for (const item of group) {
      const itemTop = getItemTop(item, viewDate)
      let placed = false
      for (let col = 0; col < columns.length; col++) {
        const last = columns[col][columns[col].length - 1]
        const lastBottom = getItemTop(last, viewDate) + getItemHeight(last, viewDate)
        if (itemTop >= lastBottom) { columns[col].push(item); placed = true; break }
      }
      if (!placed) columns.push([item])
    }
    const totalColumns = columns.length
    columns.forEach((col, colIndex) => {
      col.forEach((item) => result.push({ item, column: colIndex, totalColumns }))
    })
  }
  return result
}

function GhostBlock({ color, height }: { color: string; height: number }) {
  if (height <= 0) return null
  return (
    <div style={{
      position: 'absolute', top: 0, left: PADDING, right: PADDING, height,
      backgroundColor: `${color}15`, borderLeft: `3px dashed ${color}`,
      zIndex: 8, pointerEvents: 'none',
    }} className="rounded-b-lg overflow-hidden">
      <div className="px-1.5 pt-0.5">
        <p className="text-[10px] font-medium truncate" style={{ color, opacity: 0.7 }}>↓ continues</p>
      </div>
    </div>
  )
}

interface OverflowState {
  itemId: string
  dayIndex: number
  overflowMinutes: number
  color: string
}

function DayColumn({
  date, items, onClickSlot, onDoubleClickSlot, onClickItem, onResizeEnd,
  onResizeOverflow, ghostOverflow,
}: {
  date: Date
  items: CalendarItem[]
  onClickSlot: (date: Date) => void
  onDoubleClickSlot: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
  onResizeEnd: (item: CalendarItem, newEndDate: Date) => void
  onResizeOverflow: (overflow: OverflowState | null) => void
  ghostOverflow: number
}) {
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timedItems = items.filter((i) => !isAllDay(i))
  const layouts = computeColumnsForDay(timedItems, date)

  const handleResizeEnd = (item: CalendarItem, newEndDate: Date) => {
    onResizeOverflow(null)
    onResizeEnd(item, newEndDate)
  }

  return (
    <div className="relative border-r border-border/40" style={{ height: SLOT_HEIGHT * 24 }}
      onClick={(e) => {
        if (clickTimer.current) return
        const slotDate = getSlotDate(date, e.clientY, e.currentTarget.getBoundingClientRect())
        clickTimer.current = setTimeout(() => { clickTimer.current = null; onClickSlot(slotDate) }, 200)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null }
        const slotDate = getSlotDate(date, e.clientY, e.currentTarget.getBoundingClientRect())
        onDoubleClickSlot(slotDate)
      }}
    >
      {/* Lignes visuelles */}
      <HourLines />

      {/* Slots droppables 15min */}
      {SLOTS.map((s) => <DroppableSlot key={s} date={date} slotIndex={s} />)}

      {ghostOverflow > 0 && (
        <GhostBlock color="#8b5cf6" height={minutesToPx(ghostOverflow)} />
      )}

      {layouts.map(({ item, column, totalColumns }) => {
        const widthPct = 100 / totalColumns
        const leftPct = column * widthPct
        const color = item.type === 'event' ? (item as CalendarEvent).color : '#8b5cf6'
        return (
          <CalendarEventBlock
            key={`${item.type}-${item.id}-${date.toDateString()}`}
            item={item}
            onClickItem={onClickItem}
            onResizeEnd={handleResizeEnd}
            viewDate={date}
            style={{
              left: `calc(${leftPct}% + ${PADDING}px)`,
              right: `calc(${100 - leftPct - widthPct}% + ${PADDING}px)`,
              width: 'auto',
            }}
            onResizeOverflow={(overflowMin) => {
              if (overflowMin > 0) {
                onResizeOverflow({ itemId: `${item.type}-${item.id}`, dayIndex: 0, overflowMinutes: overflowMin, color })
              } else {
                onResizeOverflow(null)
              }
            }}
          />
        )
      })}
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
  currentDate, getItemsForDate, onClickSlot, onDoubleClickSlot,
  onClickItem, onResizeEnd,
}: CalendarWeekViewProps) {
  const days = getWeekDays(currentDate)
  const today = new Date()
  const { formatHourLabel } = useTimeFormat()
  const { getHoliday } = usePublicHolidays(currentDate.getFullYear())
  const [overflow, setOverflow] = useState<OverflowState | null>(null)

  const allDayByDay = days.map((date) => getItemsForDate(date).filter(isAllDay))
  const hasAnyAllDay = allDayByDay.some((items) => items.length > 0)
  const maxAllDay = Math.max(...allDayByDay.map((items) => items.length), 0)
  const allDayBandHeight = hasAnyAllDay ? Math.max(28, maxAllDay * 22 + 6) : 0

  return (
    <div className="flex flex-1 overflow-auto">
      {/* Colonne des heures */}
      <div className="w-14 shrink-0 border-r border-border/40 relative flex flex-col">
        {hasAnyAllDay && (
          <div className="sticky top-12 z-10 bg-background border-b border-border/40 flex items-center justify-end pr-2 shrink-0"
            style={{ height: allDayBandHeight }}>
            <span className="text-[9px] text-muted-foreground/40">all day</span>
          </div>
        )}
        <div className="sticky top-0 z-20 bg-background border-b border-border/40 h-12" />
        <div className="relative" style={{ height: SLOT_HEIGHT * 24 }}>
          {HOURS.map((h) => (
            <div key={h} className="absolute right-0 flex items-start justify-end pr-2"
              style={{ top: h * SLOT_HEIGHT - 8, height: SLOT_HEIGHT }}>
              {h !== 0 && <span className="text-[10px] text-muted-foreground/50">{formatHourLabel(h)}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Colonnes des jours */}
      <div className="flex flex-1 min-w-0">
        {days.map((date, i) => {
          const isToday = date.toDateString() === today.toDateString()
          const allDayItems = allDayByDay[i]
          const items = getItemsForDate(date)
          const holiday = getHoliday(date)
          const ghostMinutes = overflow && overflow.dayIndex === i - 1 ? overflow.overflowMinutes : 0

          return (
            <div key={date.toISOString()} className="flex-1 flex flex-col min-w-0">
              {/* Header du jour */}
              <div className={cn('sticky top-0 z-20 bg-background/95 backdrop-blur-sm h-12 flex flex-col items-center justify-center border-b border-border/40 border-r border-border/40 shrink-0',
                holiday && 'bg-amber-500/5')}>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                  {DAYS_SHORT[date.getDay()]}
                </span>
                <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                  isToday ? 'bg-violet-600 text-white' : holiday ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
                  {date.getDate()}
                </span>
              </div>

              {/* Bande all-day */}
              {hasAnyAllDay && (
                <div className="sticky top-12 z-10 border-b border-r border-border/40 bg-background/95 backdrop-blur-sm px-1 py-1 flex flex-col gap-0.5 shrink-0"
                  style={{ height: allDayBandHeight }}>
                  {holiday && (
                    <div className="w-full rounded px-1.5 py-0.5 text-[10px] font-medium truncate"
                      style={{ backgroundColor: '#f59e0b20', color: '#d97706', borderLeft: '2px solid #f59e0b' }}>
                      🎌 {holiday.localName}
                    </div>
                  )}
                  {allDayItems.map((item) => (
                    <AllDayPill key={`${item.type}-${item.id}`} item={item} onClick={onClickItem} />
                  ))}
                </div>
              )}

              <DayColumn
                date={date} items={items}
                onClickSlot={onClickSlot} onDoubleClickSlot={onDoubleClickSlot}
                onClickItem={onClickItem} onResizeEnd={onResizeEnd}
                ghostOverflow={ghostMinutes}
                onResizeOverflow={(state) => {
                  if (state) setOverflow({ ...state, dayIndex: i })
                  else setOverflow(null)
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}