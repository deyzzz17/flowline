'use client'

import { useState, useRef, useCallback } from 'react'

export type TimerPhase = 'work' | 'break' | 'free'

export interface SessionConfig {
  sessionDuration: number
  workDuration: number
  breakDuration: number
  categoryName?: string
  subCategory?: string
  taskId?: number | null
  taskTitle?: string
}

function buildState(totalElapsed: number, config: SessionConfig | null) {
  if (!config || config.sessionDuration === 0) {
    const h = Math.floor(totalElapsed / 3600)
    const m = Math.floor((totalElapsed % 3600) / 60)
    const s = totalElapsed % 60
    return {
      phase: 'free' as TimerPhase,
      displayHours: h,
      displayMinutes: m,
      displaySeconds: s,
      progress: 1,
      totalElapsed,
      sessionDuration: 0,
      currentPhaseDuration: 0,
      config,
    }
  }

  const { sessionDuration, workDuration, breakDuration } = config
  const remaining = Math.max(0, sessionDuration - totalElapsed)

  if (workDuration === 0) {
    const h = Math.floor(remaining / 3600)
    const m = Math.floor((remaining % 3600) / 60)
    const s = remaining % 60
    return {
      phase: 'work' as TimerPhase,
      displayHours: h,
      displayMinutes: m,
      displaySeconds: s,
      progress: remaining / sessionDuration,
      totalElapsed,
      sessionDuration,
      currentPhaseDuration: sessionDuration,
      config,
    }
  }

  const cycleDuration = workDuration + breakDuration
  const positionInCycle = totalElapsed % cycleDuration
  const isWork = positionInCycle < workDuration
  const phase: TimerPhase = isWork ? 'work' : 'break'
  const timeInPhase = isWork ? positionInCycle : positionInCycle - workDuration
  const phaseDuration = isWork ? workDuration : breakDuration
  const phaseRemaining = phaseDuration - timeInPhase
  const displayRemaining = Math.min(phaseRemaining, remaining)
  const effectiveMax = Math.min(phaseDuration, remaining + (phaseDuration - phaseRemaining))
  const progress = effectiveMax > 0 ? displayRemaining / effectiveMax : 0

  return {
    phase,
    displayHours: Math.floor(displayRemaining / 3600),
    displayMinutes: Math.floor((displayRemaining % 3600) / 60),
    displaySeconds: displayRemaining % 60,
    progress: Math.max(0, Math.min(1, progress)),
    totalElapsed,
    sessionDuration,
    currentPhaseDuration: effectiveMax,
    config,
  }
}

export const useTimer = () => {
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [config, setConfig] = useState<SessionConfig | null>(null)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ratingTriggeredRef = useRef(false)

  const isFreeMode = !config || config.sessionDuration === 0

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const triggerFinish = useCallback((cfg: SessionConfig) => {
    if (ratingTriggeredRef.current) return
    ratingTriggeredRef.current = true
    if (cfg.categoryName) {
      setTimeout(() => setRatingOpen(true), 800)
    }
  }, [])

  const pause = useCallback(() => {
    if (!isRunning) return
    setIsRunning(false)
    stopInterval()
  }, [isRunning, stopInterval])

  const toggle = useCallback(() => {
    if (isRunning) pause()
    else {
      if (config) {
        setIsRunning(true)
        intervalRef.current = setInterval(() => {
          setTotalElapsed((prev) => {
            const next = prev + 1
            if (config.sessionDuration > 0 && next >= config.sessionDuration) {
              clearInterval(intervalRef.current!)
              intervalRef.current = null
              setIsRunning(false)
              triggerFinish(config)
              return config.sessionDuration
            }
            return next
          })
        }, 1000)
      } else {
        setIsRunning(true)
        setHasStarted(true)
        intervalRef.current = setInterval(() => {
          setTotalElapsed((prev) => prev + 1)
        }, 1000)
      }
    }
  }, [isRunning, config, pause, triggerFinish])

  const reset = useCallback(() => {
    pause()
    setTotalElapsed(0)
    setHasStarted(false)
    setConfig(null)
    setRatingOpen(false)
    ratingTriggeredRef.current = false
  }, [pause])

  const startWithConfig = useCallback(
    (sessionConfig: SessionConfig) => {
      stopInterval()
      setTotalElapsed(0)
      setHasStarted(true)
      setIsRunning(true)
      setConfig(sessionConfig)
      ratingTriggeredRef.current = false

      setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setTotalElapsed((prev) => {
            const next = prev + 1
            if (sessionConfig.sessionDuration > 0 && next >= sessionConfig.sessionDuration) {
              clearInterval(intervalRef.current!)
              intervalRef.current = null
              setIsRunning(false)
              triggerFinish(sessionConfig)
              return sessionConfig.sessionDuration
            }
            return next
          })
        }, 1000)
      }, 0)
    },
    [stopInterval, triggerFinish],
  )

  const derived = buildState(totalElapsed, config)
  const isFinished = !!(
    config &&
    config.sessionDuration > 0 &&
    totalElapsed >= config.sessionDuration
  )

  return {
    ...derived,
    isRunning,
    hasStarted,
    isFreeMode,
    isFinished,
    toggle,
    reset,
    startWithConfig,
    config,
    customizeOpen,
    setCustomizeOpen,
    ratingOpen,
    setRatingOpen,
  }
}
