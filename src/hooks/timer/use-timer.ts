'use client'

import { useState, useRef, useCallback } from 'react'
import { useTimerSounds } from './use-timer-sounds'

export type TimerPhase = 'work' | 'break' | 'free'

export interface SessionConfig {
  sessionDuration: number
  workDuration: number
  breakDuration: number
  categoryName?: string
  categoryColor?: string
  subCategory?: string
  subCategoryColor?: string
  taskId?: number | null
  taskTitle?: string
}

function buildState(totalElapsed: number, config: SessionConfig | null) {
  if (!config || config.sessionDuration === 0) {
    return {
      phase: 'free' as TimerPhase,
      displayHours: Math.floor(totalElapsed / 3600),
      displayMinutes: Math.floor((totalElapsed % 3600) / 60),
      displaySeconds: totalElapsed % 60,
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
    return {
      phase: 'work' as TimerPhase,
      displayHours: Math.floor(remaining / 3600),
      displayMinutes: Math.floor((remaining % 3600) / 60),
      displaySeconds: remaining % 60,
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

function getPhase(elapsed: number, config: SessionConfig): TimerPhase {
  if (config.workDuration === 0) return 'work'
  const cycleDuration = config.workDuration + config.breakDuration
  const positionInCycle = elapsed % cycleDuration
  return positionInCycle < config.workDuration ? 'work' : 'break'
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
  const lastPhaseRef = useRef<TimerPhase>('work')

  const { playPhaseChange, playSessionEnd } = useTimerSounds()

  const isFreeMode = !config || config.sessionDuration === 0

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const triggerFinish = useCallback(
    (cfg: SessionConfig) => {
      if (ratingTriggeredRef.current) return
      ratingTriggeredRef.current = true
      playSessionEnd()
      if (cfg.categoryName || cfg.taskId) {
        setTimeout(() => setRatingOpen(true), 800)
      }
    },
    [playSessionEnd],
  )

  const pause = useCallback(() => {
    if (!isRunning) return
    setIsRunning(false)
    stopInterval()
  }, [isRunning, stopInterval])

  const toggle = useCallback(() => {
    if (isRunning) {
      pause()
    } else {
      setIsRunning(true)
      if (!hasStarted) setHasStarted(true)

      intervalRef.current = setInterval(() => {
        setTotalElapsed((prev) => {
          const next = prev + 1

          if (config) {
            if (config.workDuration > 0) {
              const prevPhase = getPhase(prev, config)
              const nextPhase = getPhase(next, config)
              if (prevPhase !== nextPhase) {
                lastPhaseRef.current = nextPhase
                playPhaseChange()
              }
            }

            if (config.sessionDuration > 0 && next >= config.sessionDuration) {
              clearInterval(intervalRef.current!)
              intervalRef.current = null
              setIsRunning(false)
              triggerFinish(config)
              return config.sessionDuration
            }
          }

          return next
        })
      }, 1000)
    }
  }, [isRunning, hasStarted, config, pause, playPhaseChange, triggerFinish])

  const reset = useCallback(() => {
    pause()
    setTotalElapsed(0)
    setHasStarted(false)
    setConfig(null)
    setRatingOpen(false)
    ratingTriggeredRef.current = false
    lastPhaseRef.current = 'work'
  }, [pause])

  const startWithConfig = useCallback(
    (sessionConfig: SessionConfig) => {
      stopInterval()
      setTotalElapsed(0)
      setHasStarted(true)
      setIsRunning(true)
      setConfig(sessionConfig)
      ratingTriggeredRef.current = false
      lastPhaseRef.current = 'work'

      setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setTotalElapsed((prev) => {
            const next = prev + 1

            if (sessionConfig.workDuration > 0) {
              const prevPhase = getPhase(prev, sessionConfig)
              const nextPhase = getPhase(next, sessionConfig)
              if (prevPhase !== nextPhase) {
                lastPhaseRef.current = nextPhase
                playPhaseChange()
              }
            }

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
    [stopInterval, playPhaseChange, triggerFinish],
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
