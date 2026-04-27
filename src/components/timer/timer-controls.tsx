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

export function TimerControls({
  isRunning,
  hasStarted,
  onToggle,
  onReset,
  onCustomize,
}: TimerControlsProps) {
  return (
    <div className="flex flex-col items-center gap-3 sm:gap-5">
      <div className="flex items-center gap-4 sm:gap-5">
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset"
          className={cn(
            'flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border/50 bg-background/80 text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-muted hover:text-foreground',
            hasStarted ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          )}
        >
          <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-label={isRunning ? 'Pause' : 'Start'}
          className="group relative flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl shadow-violet-500/20 transition-all duration-200 hover:scale-105 hover:bg-violet-500 hover:shadow-violet-500/30 active:scale-95"
        >
          {!isRunning && (
            <span className="absolute inset-0 animate-ping rounded-full bg-violet-500 opacity-10" />
          )}
          {isRunning ? (
            <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
          ) : (
            <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current translate-x-0.5" />
          )}
        </button>

        <div className="h-8 w-8 sm:h-10 sm:w-10" />
      </div>

      <button
        type="button"
        onClick={onCustomize}
        className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-border/40 bg-background/60 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-border/70 hover:bg-muted hover:text-foreground"
      >
        <SlidersHorizontal className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        Customize
      </button>
    </div>
  )
}
