'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart2 } from 'lucide-react'
import { TimerRing } from './timer-ring'
import { TimerDisplay } from './timer-display'
import { TimerControls } from './timer-controls'

export function TimerPageClient() {
  const [isRunning] = useState(false)
  const [hasStarted] = useState(false)
  const isFreeMode = true
  const progress = 1

  const handleToggle = () => {
    /* TODO */
  }
  const handleReset = () => {
    /* TODO */
  }
  const handleCustomize = () => {
    /* TODO */
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
          style={{
            background:
              'radial-gradient(circle, oklch(0.62 0.2 277 / 0.12) 0%, oklch(0.62 0.2 277 / 0.04) 50%, transparent 70%)',
          }}
        />
        <div
          className="absolute left-1/2 top-2/3 h-100 w-100 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
          style={{
            background: 'radial-gradient(circle, oklch(0.55 0.22 290 / 0.08) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-75 w-75 -translate-x-1/2 rounded-full blur-[90px]"
          style={{
            background: 'radial-gradient(ellipse, oklch(0.65 0.18 270 / 0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative flex items-center justify-between px-6 pt-8 sm:px-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
            Flowline
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Focus session</h1>
        </div>
        <Link
          href="/timer/analytics"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground backdrop-blur-sm transition-all hover:bg-muted hover:text-foreground hover:border-border"
          aria-label="Analytics"
        >
          <BarChart2 className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-10 px-6">
        <div className="relative flex items-center justify-center">
          <div className="w-70 h-70 sm:w-105 sm:h-105">
            <TimerRing
              progress={progress}
              isFreeMode={isFreeMode}
              isRunning={isRunning}
              size={420}
              strokeWidth={16}
            />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
            <TimerDisplay
              hours={0}
              minutes={0}
              seconds={0}
              isFreeMode={isFreeMode}
              isRunning={isRunning}
            />
            <TimerControls
              isRunning={isRunning}
              hasStarted={hasStarted}
              onToggle={handleToggle}
              onReset={handleReset}
              onCustomize={handleCustomize}
            />
          </div>
        </div>
      </div>

      <div className="relative px-6 pb-10 sm:px-10">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/50">
            Today
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: 'Sessions', value: '3' },
              { label: 'Focus time', value: '1h 24m' },
              { label: 'Longest', value: '45m' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-0.5">
                <span className="text-lg font-semibold tabular-nums text-foreground leading-none">
                  {stat.value}
                </span>
                <span className="text-[10px] text-muted-foreground/60">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full bg-violet-500/30"
                style={{ width: [28, 16, 8][i] }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
