'use client'

import { X, ExternalLink, Flame } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTimeFormat } from '@/hooks/calendar/use-time-format'

interface HabitCalendarDialogProps {
  open: boolean
  habitId: number
  habitSlug: string
  habitName: string
  habitColor: string
  habitDescription?: string | null
  startDate: string
  endDate: string
  onClose: () => void
}

export function HabitCalendarDialog({
  open,
  habitSlug,
  habitName,
  habitColor,
  habitDescription,
  startDate,
  endDate,
  onClose,
}: HabitCalendarDialogProps) {
  const router = useRouter()
  const { formatTime } = useTimeFormat()

  if (!open) return null

  const start = new Date(startDate)
  const end = new Date(endDate)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed left-1/2 top-1/2 z-50 w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-background shadow-xl">
        <div className="flex items-start justify-between gap-3 p-4 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="h-3 w-3 shrink-0 rounded-full mt-0.5"
              style={{ backgroundColor: habitColor }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{habitName}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatTime(start)} – {formatTime(end)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: `${habitColor}18`, color: habitColor }}
          >
            <Flame className="h-2.5 w-2.5" />
            Habit
          </span>
        </div>
        
        {habitDescription && (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{habitDescription}</p>
          </div>
        )}

        <div className="border-t border-border/40 mx-4" />

        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onClose()
              router.push(`/habits/${habitSlug}`)
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: habitColor, color: 'white' }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View habit
          </button>
        </div>
      </div>
    </>
  )
}