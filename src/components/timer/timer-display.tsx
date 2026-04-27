'use client'

import { cn } from '@/lib/utils'
import type { TimerPhase } from '@/hooks/timer/use-timer'

interface TimerDisplayProps {
  hours: number
  minutes: number
  seconds: number
  isFreeMode: boolean
  isRunning: boolean
  isFinished: boolean
  phase: TimerPhase
  categoryName?: string
  subCategory?: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

const PHASE_LABEL: Record<TimerPhase, string> = {
  work: 'Work',
  break: 'Break',
  free: 'Free timer',
}

const PHASE_STYLES: Record<TimerPhase, string> = {
  work: 'border-violet-500/30 bg-violet-500/8 text-violet-600 dark:text-violet-400',
  break: 'border-blue-500/30 bg-blue-500/8 text-blue-600 dark:text-blue-400',
  free: 'border-border/40 bg-background/60 text-muted-foreground/70',
}

export function TimerDisplay({
  hours,
  minutes,
  seconds,
  isFreeMode,
  isRunning,
  isFinished,
  phase,
  categoryName,
  subCategory,
}: TimerDisplayProps) {
  const showHours = hours > 0 || isFreeMode

  const statusLabel = isFinished
    ? 'Session complete'
    : !isRunning && !isFreeMode
      ? 'Paused'
      : isRunning
        ? PHASE_LABEL[phase]
        : isFreeMode
          ? 'Free timer'
          : 'Ready'

  return (
    <div className="flex flex-col items-center gap-2.5 select-none">
      <span
        className={cn(
          'rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] backdrop-blur-sm transition-all duration-500',
          isFinished
            ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400'
            : PHASE_STYLES[phase],
        )}
      >
        {statusLabel}
      </span>

      <div className="flex items-baseline tabular-nums">
        {showHours && (
          <>
            <span className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-tighter text-foreground leading-none">
              {pad(hours)}
            </span>
            <span className="mx-0.5 sm:mx-1 text-lg sm:text-2xl font-light text-muted-foreground/40 leading-none">
              :
            </span>
          </>
        )}
        <span className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-tighter text-foreground leading-none">
          {pad(minutes)}
        </span>
        <span className="mx-0.5 sm:mx-1 text-lg sm:text-2xl font-light text-muted-foreground/40 leading-none">
          :
        </span>
        <span className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-tighter text-foreground leading-none">
          {pad(seconds)}
        </span>
      </div>

      {(categoryName || subCategory) && (
        <div className="flex items-center gap-1.5 mt-0.5">
          {categoryName && (
            <span className="text-[11px] font-medium text-muted-foreground/60">{categoryName}</span>
          )}
          {categoryName && subCategory && (
            <span className="text-muted-foreground/30 text-[11px]">·</span>
          )}
          {subCategory && (
            <span className="text-[11px] text-muted-foreground/50">{subCategory}</span>
          )}
        </div>
      )}
    </div>
  )
}
