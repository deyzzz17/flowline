'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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

const LS_KEY = 'flowline_timer'

interface PersistedTimer {
  startTimestamp: number
  accumulatedSeconds: number
  isRunning: boolean
  config: SessionConfig | null
  hasStarted: boolean
}

function saveToStorage(data: PersistedTimer) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch {}
}

function loadFromStorage(): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedTimer
  } catch {
    return null
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {}
}

function computeElapsed(persisted: PersistedTimer): number {
  if (!persisted.isRunning) return persisted.accumulatedSeconds
  const secondsSinceStart = Math.floor((Date.now() - persisted.startTimestamp) / 1000)
  return persisted.accumulatedSeconds + secondsSinceStart
}

export function clearTimerStorage() {
  try {
    localStorage.removeItem('flowline_timer')
  } catch {}
}

function buildState(totalElapsed: number, config: SessionConfig | null) {
  if (
    !config ||
    (config.sessionDuration === 0 && config.workDuration === 0 && config.breakDuration === 0)
  ) {
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

  if (config.sessionDuration === 0 && (config.workDuration > 0 || config.breakDuration > 0)) {
    const workDur = config.workDuration || 0
    const breakDur = config.breakDuration || 0

    if (workDur > 0 && breakDur === 0) {
      const posInCycle = totalElapsed % workDur
      const remaining = workDur - posInCycle
      return {
        phase: 'work' as TimerPhase,
        displayHours: Math.floor(remaining / 3600),
        displayMinutes: Math.floor((remaining % 3600) / 60),
        displaySeconds: remaining % 60,
        progress: remaining / workDur,
        totalElapsed,
        sessionDuration: 0,
        currentPhaseDuration: workDur,
        config,
      }
    }

    if (breakDur > 0 && workDur === 0) {
      const posInCycle = totalElapsed % breakDur
      const remaining = breakDur - posInCycle
      return {
        phase: 'break' as TimerPhase,
        displayHours: Math.floor(remaining / 3600),
        displayMinutes: Math.floor((remaining % 3600) / 60),
        displaySeconds: remaining % 60,
        progress: remaining / breakDur,
        totalElapsed,
        sessionDuration: 0,
        currentPhaseDuration: breakDur,
        config,
      }
    }

    const cycleDuration = workDur + breakDur
    const positionInCycle = totalElapsed % cycleDuration
    const isWork = positionInCycle < workDur
    const phase: TimerPhase = isWork ? 'work' : 'break'
    const timeInPhase = isWork ? positionInCycle : positionInCycle - workDur
    const phaseDuration = isWork ? workDur : breakDur
    const phaseRemaining = phaseDuration - timeInPhase
    const progress = phaseDuration > 0 ? phaseRemaining / phaseDuration : 0

    return {
      phase,
      displayHours: Math.floor(phaseRemaining / 3600),
      displayMinutes: Math.floor((phaseRemaining % 3600) / 60),
      displaySeconds: phaseRemaining % 60,
      progress: Math.max(0, Math.min(1, progress)),
      totalElapsed,
      sessionDuration: 0,
      currentPhaseDuration: phaseDuration,
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
  const workDur = config.workDuration || 0
  const breakDur = config.breakDuration || 0
  if (workDur === 0 && breakDur === 0) return 'work'
  if (breakDur === 0) return 'work'
  const cycleDuration = workDur + breakDur
  const positionInCycle = elapsed % cycleDuration
  return positionInCycle < workDur ? 'work' : 'break'
}

export const useTimer = () => {
  const initFromStorage = (): {
    elapsed: number
    isRunning: boolean
    hasStarted: boolean
    config: SessionConfig | null
  } => {
    const persisted = loadFromStorage()
    if (!persisted) return { elapsed: 0, isRunning: false, hasStarted: false, config: null }
    return {
      elapsed: computeElapsed(persisted),
      isRunning: persisted.isRunning,
      hasStarted: persisted.hasStarted,
      config: persisted.config,
    }
  }

  const init = initFromStorage()

  const [totalElapsed, setTotalElapsed] = useState(init.elapsed)
  const [isRunning, setIsRunning] = useState(init.isRunning)
  const [hasStarted, setHasStarted] = useState(init.hasStarted)
  const [config, setConfig] = useState<SessionConfig | null>(init.config)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ratingTriggeredRef = useRef(false)
  const lastPhaseRef = useRef<TimerPhase>('work')
  const stateRef = useRef({
    isRunning: init.isRunning,
    config: init.config,
    hasStarted: init.hasStarted,
  })

  const { playPhaseChange, playSessionEnd } = useTimerSounds()

  const isFreeMode =
    !config ||
    (config.sessionDuration === 0 && config.workDuration === 0 && config.breakDuration === 0)

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
      setTimeout(() => setRatingOpen(true), 800)
    },
    [playSessionEnd],
  )

  const startInterval = useCallback(
    (currentConfig: SessionConfig | null, accumulatedSeconds: number, startTimestamp: number) => {
      stopInterval()

      intervalRef.current = setInterval(() => {
        const secondsElapsed = Math.floor((Date.now() - startTimestamp) / 1000)
        const next = accumulatedSeconds + secondsElapsed

        setTotalElapsed((prev) => {
          if (
            currentConfig &&
            (currentConfig.workDuration > 0 || currentConfig.breakDuration > 0)
          ) {
            const prevPhase = getPhase(prev, currentConfig)
            const nextPhase = getPhase(next, currentConfig)
            if (prevPhase !== nextPhase) {
              lastPhaseRef.current = nextPhase
              playPhaseChange()
            }
          }

          if (
            currentConfig &&
            currentConfig.sessionDuration > 0 &&
            next >= currentConfig.sessionDuration
          ) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            setIsRunning(false)
            stateRef.current.isRunning = false
            clearStorage()
            triggerFinish(currentConfig)
            return currentConfig.sessionDuration
          }

          return next
        })
      }, 500)
    },
    [stopInterval, playPhaseChange, triggerFinish],
  )

  useEffect(() => {
    if ((init.isRunning && init.config !== null) || init.isRunning) {
      const persisted = loadFromStorage()
      if (persisted?.isRunning) {
        stateRef.current = { isRunning: true, config: init.config, hasStarted: true }
        startInterval(init.config, persisted.accumulatedSeconds, persisted.startTimestamp)
      }
    }
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const persisted = loadFromStorage()
        if (!persisted?.isRunning) return
        const correctedElapsed = computeElapsed(persisted)
        setTotalElapsed(correctedElapsed)
        startInterval(persisted.config, persisted.accumulatedSeconds, persisted.startTimestamp)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [startInterval])

  const pause = useCallback(() => {
    if (!isRunning) return
    stopInterval()
    setIsRunning(false)
    stateRef.current.isRunning = false
    setTotalElapsed((prev) => {
      saveToStorage({
        startTimestamp: 0,
        accumulatedSeconds: prev,
        isRunning: false,
        config,
        hasStarted,
      })
      return prev
    })
  }, [isRunning, stopInterval, config, hasStarted])

  const toggle = useCallback(() => {
    if (isRunning) {
      pause()
    } else {
      const startTimestamp = Date.now()
      setIsRunning(true)
      stateRef.current.isRunning = true
      if (!hasStarted) setHasStarted(true)
      setTotalElapsed((prev) => {
        saveToStorage({
          startTimestamp,
          accumulatedSeconds: prev,
          isRunning: true,
          config,
          hasStarted: true,
        })
        startInterval(config, prev, startTimestamp)
        return prev
      })
    }
  }, [isRunning, hasStarted, config, pause, startInterval])

  const reset = useCallback(() => {
    pause()

    if (hasStarted && totalElapsed >= 5) {
      if (!ratingTriggeredRef.current) {
        ratingTriggeredRef.current = true
        playSessionEnd()
        setTimeout(() => setRatingOpen(true), 100)
        return
      }
    }

    clearStorage()
    setTotalElapsed(0)
    setHasStarted(false)
    setConfig(null)
    setRatingOpen(false)
    ratingTriggeredRef.current = false
    lastPhaseRef.current = 'work'
  }, [pause, hasStarted, totalElapsed, playSessionEnd])

  const forceReset = useCallback(() => {
    stopInterval()
    clearStorage()
    setIsRunning(false)
    setTotalElapsed(0)
    setHasStarted(false)
    setConfig(null)
    setRatingOpen(false)
    ratingTriggeredRef.current = false
    lastPhaseRef.current = 'work'
    stateRef.current = { isRunning: false, config: null, hasStarted: false }
  }, [stopInterval])

  const startWithConfig = useCallback(
    (sessionConfig: SessionConfig) => {
      stopInterval()
      const startTimestamp = Date.now()
      setTotalElapsed(0)
      setHasStarted(true)
      setIsRunning(true)
      setConfig(sessionConfig)
      ratingTriggeredRef.current = false
      lastPhaseRef.current = 'work'
      stateRef.current = { isRunning: true, config: sessionConfig, hasStarted: true }
      saveToStorage({
        startTimestamp,
        accumulatedSeconds: 0,
        isRunning: true,
        config: sessionConfig,
        hasStarted: true,
      })
      startInterval(sessionConfig, 0, startTimestamp)
    },
    [stopInterval, startInterval],
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
    forceReset,
    startWithConfig,
    config,
    customizeOpen,
    setCustomizeOpen,
    ratingOpen,
    setRatingOpen,
  }
}
