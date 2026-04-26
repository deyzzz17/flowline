'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart2, Flame, Clock, Target } from 'lucide-react'
import { TimerRing } from './timer-ring'
import { TimerDisplay } from './timer-display'
import { TimerControls } from './timer-controls'

const TIMER_COLOR = '#8b5cf6'

const MOCK_STATS = [
  {
    label: 'Sessions today',
    value: '3',
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    label: 'Focus time',
    value: '1h 24m',
    icon: Clock,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    label: "Today's goal",
    value: '2h',
    icon: Target,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
]

export const TimerPageClient = () => {
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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/3 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.04] dark:opacity-[0.06] blur-3xl"
          style={{ background: TIMER_COLOR }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              Timer
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
              Focus session
            </h1>
          </div>

          <Link
            href="/timer/analytics"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            aria-label="Analytics"
          >
            <BarChart2 className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:justify-center lg:gap-24">
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <TimerRing
                progress={progress}
                isFreeMode={isFreeMode}
                isRunning={isRunning}
                size={320}
                strokeWidth={14}
                color={TIMER_COLOR}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <TimerDisplay
                  hours={0}
                  minutes={0}
                  seconds={0}
                  isFreeMode={isFreeMode}
                  isRunning={isRunning}
                />
              </div>
            </div>

            <div className="mt-8">
              <TimerControls
                isRunning={isRunning}
                hasStarted={hasStarted}
                onToggle={handleToggle}
                onReset={handleReset}
                onCustomize={handleCustomize}
              />
            </div>
          </div>

          <div className="flex w-full max-w-sm flex-col gap-4 lg:w-72">
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
              <div className="border-b border-border/50 px-5 py-3.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Today
                </p>
              </div>
              <div className="divide-y divide-border/30">
                {MOCK_STATS.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3 px-5 py-3.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                    >
                      <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
              <div className="border-b border-border/50 px-5 py-3.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Recent sessions
                </p>
              </div>
              <div className="divide-y divide-border/30">
                {[
                  { label: 'Deep work', duration: '45m', time: '09:15', dot: 'bg-violet-500' },
                  { label: 'Review', duration: '25m', time: '11:00', dot: 'bg-blue-500' },
                  { label: 'Planning', duration: '14m', time: '14:30', dot: 'bg-emerald-500' },
                ].map((session) => (
                  <div key={session.time} className="flex items-center gap-3 px-5 py-3">
                    <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${session.dot}`} />
                    <p className="flex-1 text-sm text-foreground">{session.label}</p>
                    <p className="text-xs font-semibold text-foreground tabular-nums">
                      {session.duration}
                    </p>
                    <p className="w-10 text-right text-xs text-muted-foreground/60">
                      {session.time}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3">
                <Link
                  href="/timer/analytics"
                  className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
                >
                  View all sessions →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    Free mode
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Timer runs without limit</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15">
                  <Clock className="h-3.5 w-3.5 text-violet-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
