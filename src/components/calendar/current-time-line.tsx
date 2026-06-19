'use client'

import { useCurrentTimePosition } from '@/hooks/calendar/use-current-time'

interface CurrentTimeLineProps {
  isToday?: boolean
}

export function CurrentTimeLine({ isToday = true }: CurrentTimeLineProps) {
  const top = useCurrentTimePosition()

  if (!isToday) return null

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
      style={{ top }}
    >
      <div className="h-2.5 w-2.5 shrink-0 -ml-1 rounded-full bg-violet-500 shadow-[0_0_0_2px_rgba(139,92,246,0.25)]" />
      <div className="h-px flex-1 bg-violet-500" />
    </div>
  )
}
