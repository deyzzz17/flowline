'use client'

import { useRef, useCallback } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { useTimeFormat } from '@/hooks/calendar/use-time-format'
import type { CalendarItem, CalendarEvent, CalendarTask } from '@/hooks/calendar/use-calendar'

const SLOT_HEIGHT = 56
const MIN_DURATION_MIN = 15

export function minutesToPx(minutes: number) {
  return (minutes / 60) * SLOT_HEIGHT
}
export function pxToMinutes(px: number) {
  return (px / SLOT_HEIGHT) * 60
}

export function getItemTop(item: CalendarItem): number {
  const date = new Date(item.type === 'event' ? item.startDate : item.dueDate)
  return minutesToPx(date.getHours() * 60 + date.getMinutes())
}

export function getItemHeight(item: CalendarItem): number {
  if (item.type === 'event') {
    const start = new Date(item.startDate)
    const end = new Date(item.endDate)
    const durationMin = Math.max(MIN_DURATION_MIN, (end.getTime() - start.getTime()) / 60000)
    return minutesToPx(durationMin)
  }
  return minutesToPx(30)
}

export function CalendarEventBlock({
  item,
  onClickItem,
  onResizeEnd,
  paddingX = 2,
  displayHeight,
}: {
  item: CalendarItem
  onClickItem: (item: CalendarItem) => void
  onResizeEnd: (item: CalendarItem, newEndDate: Date) => void
  paddingX?: number
  displayHeight?: number
}) {
  const { formatTime } = useTimeFormat()

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${item.type}-${item.id}`,
    data: { item },
  })

  const top = getItemTop(item)
  const height = displayHeight ?? getItemHeight(item)

  const color =
    item.type === 'event' ? (item as CalendarEvent).color : (item as CalendarTask).listColor

  const startDate = new Date(item.type === 'event' ? item.startDate : item.dueDate)
  const endDate =
    item.type === 'event'
      ? new Date((item as CalendarEvent).endDate)
      : new Date(startDate.getTime() + 30 * 60000)

  const resizeStartY = useRef<number | null>(null)
  const resizeStartHeight = useRef<number>(height)
  const isResizing = useRef(false)
  const blockRef = useRef<HTMLDivElement | null>(null)

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      resizeStartY.current = e.clientY
      resizeStartHeight.current = height
      isResizing.current = false

      const el = blockRef.current

      const onMouseMove = (ev: MouseEvent) => {
        if (resizeStartY.current === null) return
        isResizing.current = true
        const deltaY = ev.clientY - resizeStartY.current
        const newHeightPx = Math.max(
          minutesToPx(MIN_DURATION_MIN),
          resizeStartHeight.current + deltaY,
        )
        const newDurationMin = Math.round(pxToMinutes(newHeightPx) / 15) * 15
        if (el) el.style.height = `${minutesToPx(newDurationMin)}px`
      }

      const onMouseUp = (ev: MouseEvent) => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        if (!isResizing.current || resizeStartY.current === null) {
          resizeStartY.current = null
          return
        }
        const deltaY = ev.clientY - resizeStartY.current
        const newHeightPx = Math.max(
          minutesToPx(MIN_DURATION_MIN),
          resizeStartHeight.current + deltaY,
        )
        const newDurationMin = Math.round(pxToMinutes(newHeightPx) / 15) * 15
        const newEnd = new Date(startDate.getTime() + newDurationMin * 60000)
        resizeStartY.current = null
        onResizeEnd(item, newEnd)
        setTimeout(() => {
          isResizing.current = false
        }, 50)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [height, startDate, item, onResizeEnd],
  )

  return (
    <div
      ref={(node) => {
        blockRef.current = node
        setNodeRef(node)
      }}
      style={{
        position: 'absolute',
        top,
        left: paddingX,
        right: paddingX,
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
        className="absolute inset-0 bottom-3 cursor-grab active:cursor-grabbing px-1.5 pt-0.5"
        onClick={(e) => {
          e.stopPropagation()
          if (!isResizing.current) onClickItem(item)
        }}
      >
        <p className="text-[11px] font-semibold truncate leading-tight" style={{ color }}>
          {item.title}
        </p>
        {height > 32 && (
          <p className="text-[10px] leading-tight" style={{ color, opacity: 0.7 }}>
            {formatTime(startDate)} – {formatTime(endDate)}
          </p>
        )}
      </div>

      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize flex items-center justify-center group"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-8 h-0.5 rounded-full transition-opacity opacity-40 group-hover:opacity-80"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}
