'use client'

import { cn } from '@/lib/utils'
import type { CalendarItem } from '@/hooks/calendar/use-calendar'

interface CalendarItemPillProps {
  item: CalendarItem
  onClick: () => void
  isDragging?: boolean
  compact?: boolean
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function CalendarItemPill({ item, onClick, isDragging, compact }: CalendarItemPillProps) {
  const isTask = item.type === 'task'
  const color = isTask ? item.listColor : item.color
  const time = isTask ? formatTime(item.dueDate) : item.allDay ? null : formatTime(item.startDate)
  const sub = isTask ? item.listName : null

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'group w-full flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-xs font-medium transition-all',
        'border border-transparent hover:border-white/20',
        isDragging && 'opacity-50 scale-95 cursor-grabbing',
        !isDragging && 'cursor-pointer hover:brightness-110',
      )}
      style={{ backgroundColor: `${color}20`, color, touchAction: 'none' }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="truncate leading-tight">{item.title}</p>
        {!compact && (sub || time) && (
          <p className="truncate text-[10px] opacity-70 leading-tight mt-0.5">
            {[time, sub].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </button>
  )
}
