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

export function getItemTop(item: CalendarItem, viewDate?: Date): number {
  const start = new Date(item.type === 'event' ? item.startDate : item.dueDate)
  if (viewDate) {
    const dayStart = new Date(viewDate)
    dayStart.setHours(0, 0, 0, 0)
    if (start < dayStart) return 0
  }
  return minutesToPx(start.getHours() * 60 + start.getMinutes())
}

export function getItemHeight(item: CalendarItem, viewDate?: Date): number {
  if (item.type !== 'event') return minutesToPx(30)
  const start = new Date(item.startDate)
  const end = new Date(item.endDate)
  let effectiveStart = start
  let effectiveEnd = end
  if (viewDate) {
    const dayStart = new Date(viewDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(viewDate)
    dayEnd.setHours(24, 0, 0, 0)
    if (start < dayStart) effectiveStart = dayStart
    if (end > dayEnd) effectiveEnd = dayEnd
  } else {
    const midnight = new Date(start)
    midnight.setHours(24, 0, 0, 0)
    if (end > midnight) effectiveEnd = midnight
  }
  const durationMin = Math.max(
    MIN_DURATION_MIN,
    (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000,
  )
  return minutesToPx(durationMin)
}

export function CalendarEventBlock({
  item,
  onClickItem,
  onResizeEnd,
  paddingX = 2,
  displayHeight,
  style,
  viewDate,
  onResizeOverflow,
}: {
  item: CalendarItem
  onClickItem: (item: CalendarItem) => void
  onResizeEnd: (item: CalendarItem, newEndDate: Date) => void
  paddingX?: number
  displayHeight?: number
  style?: React.CSSProperties
  viewDate?: Date
  onResizeOverflow?: (overflowMinutes: number) => void
}) {
  const { formatTime } = useTimeFormat()

  // ── ID unique par occurrence ──────────────────────────────────────────────
  // Pour les occurrences récurrentes, plusieurs blocks ont le même item.id
  // → on utilise optimisticKey qui est unique par occurrence
  const draggableId =
    item.type === 'event'
      ? ((item as CalendarEvent).optimisticKey ?? `event-${item.id}`)
      : `task-${item.id}`

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableId,
    data: { item },
  })

  const top = getItemTop(item, viewDate)
  const height = displayHeight ?? getItemHeight(item, viewDate)

  const color =
    item.type === 'event' ? (item as CalendarEvent).color : (item as CalendarTask).listColor

  const startDate = new Date(item.type === 'event' ? item.startDate : item.dueDate)
  const endDate =
    item.type === 'event'
      ? new Date((item as CalendarEvent).endDate)
      : new Date(startDate.getTime() + 30 * 60000)

  const continuesNextDay = viewDate
    ? endDate >
      (() => {
        const d = new Date(viewDate)
        d.setHours(24, 0, 0, 0)
        return d
      })()
    : false
  const continuesPrevDay = viewDate
    ? startDate <
      (() => {
        const d = new Date(viewDate)
        d.setHours(0, 0, 0, 0)
        return d
      })()
    : false

  const resizeBaseDate =
    continuesPrevDay && viewDate
      ? (() => {
          const d = new Date(viewDate)
          d.setHours(0, 0, 0, 0)
          return d
        })()
      : startDate

  const minutesBeforeThisDay = continuesPrevDay
    ? 0
    : startDate.getHours() * 60 + startDate.getMinutes()
  const maxDurationMin = 24 * 60 - minutesBeforeThisDay

  const resizeStartY = useRef<number | null>(null)
  const resizeStartHeight = useRef<number>(height)
  const isResizing = useRef(false)
  const blockRef = useRef<HTMLDivElement | null>(null)

  const startResize = useCallback(
    (clientY: number) => {
      resizeStartY.current = clientY
      resizeStartHeight.current = height
      isResizing.current = false
    },
    [height],
  )

  const updateResize = useCallback(
    (clientY: number) => {
      if (resizeStartY.current === null) return
      isResizing.current = true
      const deltaY = clientY - resizeStartY.current
      const newHeightPx = Math.max(
        minutesToPx(MIN_DURATION_MIN),
        resizeStartHeight.current + deltaY,
      )
      const newDurationMin = Math.round(pxToMinutes(newHeightPx) / 15) * 15
      const overflowMin = Math.max(0, newDurationMin - maxDurationMin)
      onResizeOverflow?.(overflowMin)
      const clampedMin = Math.min(newDurationMin, maxDurationMin)
      const el = blockRef.current
      if (el) el.style.height = `${minutesToPx(clampedMin)}px`
    },
    [maxDurationMin, onResizeOverflow],
  )

  const endResize = useCallback(
    (clientY: number) => {
      if (!isResizing.current || resizeStartY.current === null) {
        resizeStartY.current = null
        return
      }
      const deltaY = clientY - resizeStartY.current
      const newHeightPx = Math.max(
        minutesToPx(MIN_DURATION_MIN),
        resizeStartHeight.current + deltaY,
      )
      const newDurationMin = Math.round(pxToMinutes(newHeightPx) / 15) * 15
      const newEnd = new Date(resizeBaseDate.getTime() + newDurationMin * 60000)
      resizeStartY.current = null
      onResizeOverflow?.(0)
      onResizeEnd(item, newEnd)
      setTimeout(() => {
        isResizing.current = false
      }, 50)
    },
    [resizeBaseDate, item, onResizeEnd, onResizeOverflow],
  )

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      startResize(e.clientY)
      const onMouseMove = (ev: MouseEvent) => updateResize(ev.clientY)
      const onMouseUp = (ev: MouseEvent) => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        endResize(ev.clientY)
      }
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [startResize, updateResize, endResize],
  )

  const handleResizeTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation()
      const touch = e.touches[0]
      if (!touch) return
      startResize(touch.clientY)
      const onTouchMove = (ev: TouchEvent) => {
        const t = ev.touches[0]
        if (!t) return
        ev.preventDefault()
        updateResize(t.clientY)
      }
      const onTouchEnd = (ev: TouchEvent) => {
        document.removeEventListener('touchmove', onTouchMove)
        document.removeEventListener('touchend', onTouchEnd)
        const t = ev.changedTouches[0]
        if (t) endResize(t.clientY)
      }
      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend', onTouchEnd)
    },
    [startResize, updateResize, endResize],
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
        ...style,
      }}
      className={cn(
        'overflow-hidden select-none',
        continuesPrevDay ? 'rounded-t-none' : 'rounded-t-lg',
        continuesNextDay ? 'rounded-b-none' : 'rounded-b-lg',
        isDragging && 'opacity-40',
      )}
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

      {!continuesNextDay && (
        <div
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeTouchStart}
          className="absolute bottom-0 left-0 right-0 h-4 cursor-s-resize flex items-center justify-center group touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-8 h-1 rounded-full transition-opacity opacity-40 group-hover:opacity-80"
            style={{ backgroundColor: color }}
          />
        </div>
      )}
    </div>
  )
}
