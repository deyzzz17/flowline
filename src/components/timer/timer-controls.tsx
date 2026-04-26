'use client'

import { Play, Pause, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimerControlsProps {
  isRunning: boolean
  hasStarted: boolean
  onToggle: () => void
  onReset: () => void
  onCustomize: () => void
}

export const TimerControls = ({
  isRunning,
  hasStarted,
  onToggle,
  onReset,
  onCustomize,
}: TimerControlsProps) => {
  return (
    <div className="flex flex-col items-center gap-4 mt-2">
      <div className="flex items-center gap-4">
        {hasStarted && (
          <button
            type="button"
            onClick={onReset}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:scale-105"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95',
            'bg-violet-600 text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500',
          )}
          aria-label={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current translate-x-0.5" />
          )}
        </button>

        {!hasStarted && <div className="h-11 w-11" />}
      </div>
      <button
        type="button"
        onClick={onCustomize}
        className="flex items-center gap-2 rounded-full border border-border/50 bg-background px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:border-border"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Customize
      </button>
    </div>
  )
}
