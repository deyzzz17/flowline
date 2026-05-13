'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useTimer, type SessionConfig, type TimerPhase } from '@/hooks/timer/use-timer'

interface TimerContextValue {
  isRunning: boolean
  hasStarted: boolean
  isFreeMode: boolean
  isFinished: boolean
  phase: TimerPhase
  displayHours: number
  displayMinutes: number
  displaySeconds: number
  progress: number
  totalElapsed: number
  sessionDuration: number
  currentPhaseDuration: number
  config: SessionConfig | null
  customizeOpen: boolean
  setCustomizeOpen: (v: boolean) => void
  ratingOpen: boolean
  setRatingOpen: (v: boolean) => void
  toggle: () => void
  reset: () => void
  forceReset: () => void
  startWithConfig: (config: SessionConfig) => void
}

const TimerContext = createContext<TimerContextValue | null>(null)

export function TimerProvider({ children }: { children: ReactNode }) {
  const timer = useTimer()

  return <TimerContext.Provider value={timer}>{children}</TimerContext.Provider>
}

export function useTimerContext() {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimerContext must be used within TimerProvider')
  return ctx
}
