'use client'

import { useState, useRef, useCallback } from 'react'

export interface TimerState {
  isRunning: boolean
  hasStarted: boolean
  elapsed: number
}

export const useTimer = () => {
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    setHasStarted(true)
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
  }, [isRunning])

  const pause = useCallback(() => {
    if (!isRunning) return
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [isRunning])

  const toggle = useCallback(() => {
    if (isRunning) pause()
    else start()
  }, [isRunning, start, pause])

  const reset = useCallback(() => {
    pause()
    setElapsed(0)
    setHasStarted(false)
  }, [pause])

  const hours = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  const seconds = elapsed % 60

  return {
    isRunning,
    hasStarted,
    elapsed,
    hours,
    minutes,
    seconds,
    toggle,
    reset,
    customizeOpen,
    setCustomizeOpen,
  }
}
