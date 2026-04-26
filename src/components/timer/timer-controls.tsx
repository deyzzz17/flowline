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
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/80 text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-muted hover:text-foreground',
            hasStarted ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-label={isRunning ? 'Pause' : 'Start'}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl shadow-violet-500/20 transition-all duration-200 hover:scale-105 hover:bg-violet-500 hover:shadow-violet-500/30 active:scale-95"
        >
          {!isRunning && (
            <span className="absolute inset-0 animate-ping rounded-full bg-violet-500 opacity-10" />
          )}
          {isRunning ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current translate-x-0.5" />
          )}
        </button>

        <div className="h-10 w-10" />
      </div>

      <button
        type="button"
        onClick={onCustomize}
        className="flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-border/70 hover:bg-muted hover:text-foreground"
      >
        <SlidersHorizontal className="h-3 w-3" />
        Customize
      </button>
    </div>
  )
}
