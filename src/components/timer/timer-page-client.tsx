'use client'

import Link from 'next/link'
import { BarChart2 } from 'lucide-react'
import { TimerRing } from './timer-ring'
import { TimerDisplay } from './timer-display'
import { TimerControls } from './timer-controls'
import { TimerCustomizeDialog } from './timer-customize-dialog'
import { SessionRatingDialog } from './session-rating-dialog'
import { useTimer } from '@/hooks/timer/use-timer'
import type { SessionConfig } from '@/hooks/timer/use-timer'

export function TimerPageClient() {
  const {
    isRunning,
    hasStarted,
    isFreeMode,
    phase,
    displayHours,
    displayMinutes,
    displaySeconds,
    progress,
    isFinished,
    totalElapsed,
    toggle,
    reset,
    startWithConfig,
    config,
    customizeOpen,
    setCustomizeOpen,
    ratingOpen,
    setRatingOpen,
  } = useTimer()

  const handleStartSession = (sessionConfig: SessionConfig) => {
    setCustomizeOpen(false)
    startWithConfig(sessionConfig)
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <TimerCustomizeDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        onStart={handleStartSession}
      />

      <SessionRatingDialog
        open={ratingOpen}
        onClose={() => {
          setRatingOpen(false)
          reset()
        }}
        config={config}
        totalElapsed={totalElapsed}
      />

      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 size-150 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] transition-all duration-1000"
          style={{
            background:
              phase === 'break'
                ? 'radial-gradient(circle, oklch(0.6 0.18 220 / 0.1) 0%, oklch(0.6 0.18 220 / 0.03) 50%, transparent 70%)'
                : 'radial-gradient(circle, oklch(0.62 0.2 277 / 0.12) 0%, oklch(0.62 0.2 277 / 0.04) 50%, transparent 70%)',
          }}
        />
        <div
          className="absolute left-1/2 top-2/3 size-100 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
          style={{
            background: 'radial-gradient(circle, oklch(0.55 0.22 290 / 0.08) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-75 w-125 -translate-x-1/2 rounded-full blur-[90px]"
          style={{
            background: 'radial-gradient(ellipse, oklch(0.65 0.18 270 / 0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative flex items-center justify-between px-5 pt-6 sm:px-10 sm:pt-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
            Flowline
          </p>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Focus session
          </h1>
        </div>
        <Link
          href="/timer/analytics"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground backdrop-blur-sm transition-all hover:bg-muted hover:text-foreground hover:border-border"
          aria-label="Analytics"
        >
          <BarChart2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Link>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6">
        <div
          className="relative"
          style={{ width: 'clamp(260px, 70vmin, 420px)', height: 'clamp(260px, 70vmin, 420px)' }}
        >
          <TimerRing
            progress={progress}
            isFreeMode={isFreeMode}
            isRunning={isRunning}
            phase={phase}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 sm:gap-8">
            <TimerDisplay
              hours={displayHours}
              minutes={displayMinutes}
              seconds={displaySeconds}
              isFreeMode={isFreeMode}
              isRunning={isRunning}
              isFinished={isFinished}
              phase={phase}
              categoryName={config?.categoryName}
              subCategory={config?.subCategory}
            />
            {!isFinished && (
              <TimerControls
                isRunning={isRunning}
                hasStarted={hasStarted}
                onToggle={toggle}
                onReset={reset}
                onCustomize={() => setCustomizeOpen(true)}
              />
            )}
            {isFinished && (
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500/20"
              >
                Start new session
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative px-5 pb-8 sm:px-10 sm:pb-10">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-2.5 sm:gap-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/50">
            Today
          </p>
          <div className="flex items-center gap-5 sm:gap-6">
            {[
              { label: 'Sessions', value: '3' },
              { label: 'Focus time', value: '1h 24m' },
              { label: 'Longest', value: '45m' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-0.5">
                <span className="text-base sm:text-lg font-semibold tabular-nums text-foreground leading-none">
                  {stat.value}
                </span>
                <span className="text-[10px] text-muted-foreground/60">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {[28, 16, 8].map((w, i) => (
              <div key={i} className="h-1 rounded-full bg-violet-500/30" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
