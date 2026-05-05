'use client'

import { useRef, useCallback } from 'react'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { CalendarItem, CalendarEvent, CalendarTask } from '@/hooks/calendar/use-calendar'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SLOT_HEIGHT = 56 
const MIN_DURATION_MIN = 15 

function getWeekDays(currentDate: Date): Date[] {
  const start = new Date(currentDate)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

function minutesToPx(minutes: number) {
  return (minutes / 60) * SLOT_HEIGHT
}

function pxToMinutes(px: number) {
  return (px / SLOT_HEIGHT) * 60
}

function getItemTop(item: CalendarItem): number {
  const date = new Date(item.type === 'event' ? item.startDate : item.dueDate)
  return minutesToPx(date.getHours() * 60 + date.getMinutes())
}

function getItemHeight(item: CalendarItem): number {
  if (item.type === 'event') {
    const start = new Date(item.startDate)
    const end = new Date(item.endDate)
    const durationMin = Math.max(MIN_DURATION_MIN, (end.getTime() - start.getTime()) / 60000)
    return minutesToPx(durationMin)
  }
  return minutesToPx(30)
}

function formatHour(h: number) {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

function DroppableSlot({ date, hour }: { date: Date; hour: number }) {
  const slotDate = new Date(date)
  slotDate.setHours(hour, 0, 0, 0)
  const { setNodeRef, isOver } = useDroppable({ id: slotDate.toISOString() })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-0 right-0 border-b border-border/20 transition-colors pointer-events-auto',
        isOver && 'bg-violet-500/5',
      )}
      style={{ top: hour * SLOT_HEIGHT, height: SLOT_HEIGHT }}
    />
  )
}

function CalendarEventBlock({
  item,
  onClickItem,
  onResizeEnd,
}: {
  item: CalendarItem
  onClickItem: (item: CalendarItem) => void
  onResizeEnd: (item: CalendarItem, newEndDate: Date) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${item.type}-${item.id}`,
    data: { item },
  })

  const top = getItemTop(item)
  const height = getItemHeight(item)

  const color =
    item.type === 'event' ? (item as CalendarEvent).color : (item as CalendarTask).listColor

  const title = item.title

  const startDate = new Date(item.type === 'event' ? item.startDate : item.dueDate)
  const endDate =
    item.type === 'event'
      ? new Date((item as CalendarEvent).endDate)
      : new Date(startDate.getTime() + 30 * 60000)

  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  const resizeStartY = useRef<number | null>(null)
  const resizeStartHeight = useRef<number>(height)

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      resizeStartY.current = e.clientY
      resizeStartHeight.current = height

      const onMouseMove = (ev: MouseEvent) => {
        if (resizeStartY.current === null) return
        const deltaY = ev.clientY - resizeStartY.current
        const newHeightPx = Math.max(
          minutesToPx(MIN_DURATION_MIN),
          resizeStartHeight.current + deltaY,
        )
        const newDurationMin = Math.round(pxToMinutes(newHeightPx) / 15) * 15
        const el = e.currentTarget.closest('[data-resize-target]') as HTMLElement
        if (el) el.style.height = `${minutesToPx(newDurationMin)}px`
      }

      const onMouseUp = (ev: MouseEvent) => {
        if (resizeStartY.current === null) return
        const deltaY = ev.clientY - resizeStartY.current
        const newHeightPx = Math.max(
          minutesToPx(MIN_DURATION_MIN),
          resizeStartHeight.current + deltaY,
        )
        const newDurationMin = Math.round(pxToMinutes(newHeightPx) / 15) * 15
        const newEnd = new Date(startDate.getTime() + newDurationMin * 60000)
        onResizeEnd(item, newEnd)
        resizeStartY.current = null
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [height, startDate, item, onResizeEnd],
  )

  return (
    <div
      data-resize-target
      ref={setNodeRef}
      style={{
        position: 'absolute',
        top,
        left: 2,
        right: 2,
        height,
        backgroundColor: `${color}22`,
        borderLeft: `3px solid ${color}`,
        zIndex: isDragging ? 50 : 10,
      }}
      className={cn('rounded-r-lg overflow-hidden select-none', isDragging && 'opacity-40')}
    >
      <div
        {...listeners}
        {...attributes}
        className="absolute inset-0 bottom-2 cursor-grab active:cursor-grabbing px-1.5 pt-0.5"
        onClick={(e) => {
          e.stopPropagation()
          onClickItem(item)
        }}
      >
        <p className="text-[11px] font-semibold truncate leading-tight" style={{ color }}>
          {title}
        </p>
        {height > 30 && (
          <p className="text-[10px] leading-tight" style={{ color, opacity: 0.7 }}>
            {formatTime(startDate)} – {formatTime(endDate)}
          </p>
        )}
      </div>

      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: color, opacity: 0.5 }} />
      </div>
    </div>
  )
}

function DayColumn({
  date,
  items,
  onClickSlot,
  onClickItem,
  onResizeEnd,
}: {
  date: Date
  items: CalendarItem[]
  onClickSlot: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
  onResizeEnd: (item: CalendarItem, newEndDate: Date) => void
}) {
  const totalHeight = SLOT_HEIGHT * 24

  return (
    <div
      className="relative border-r border-border/40"
      style={{ height: totalHeight }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const y = e.clientY - rect.top
        const totalMinutes = Math.floor(pxToMinutes(y) / 15) * 15
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        const slotDate = new Date(date)
        slotDate.setHours(hours, minutes, 0, 0)
        onClickSlot(slotDate)
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
        />
      ))}
    </div>
  )
}

interface CalendarWeekViewProps {
  currentDate: Date
  getItemsForDate: (date: Date) => CalendarItem[]
  onClickSlot: (date: Date) => void
  onClickItem: (item: CalendarItem) => void
  onResizeEnd: (item: CalendarItem, newEndDate: Date) => void
}

export function CalendarWeekView({
  currentDate,
  getItemsForDate,
  onClickSlot,
  onClickItem,
  onResizeEnd,
}: CalendarWeekViewProps) {
  const days = getWeekDays(currentDate)
  const today = new Date()

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
              <span className="text-[10px] text-muted-foreground/50">{formatHour(h)}</span>
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
                onClickItem={onClickItem}
                onResizeEnd={onResizeEnd}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
