'use client'

import { useSyncExternalStore } from 'react'

const SLOT_HEIGHT = 56
const REFRESH_MS = 15000

function getMinutesSinceMidnight(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
}

let currentMinutes = getMinutesSinceMidnight()
const listeners = new Set<() => void>()
let intervalId: ReturnType<typeof setInterval> | null = null

function ensureInterval() {
  if (intervalId !== null) return
  intervalId = setInterval(() => {
    currentMinutes = getMinutesSinceMidnight()
    listeners.forEach((l) => l())
  }, REFRESH_MS)
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  ensureInterval()
  return () => {
    listeners.delete(callback)
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

function getSnapshot() {
  return currentMinutes
}

export function minutesToPxTimeline(minutes: number): number {
  return (minutes / 60) * SLOT_HEIGHT
}

export function useCurrentTimePosition(): number {
  const minutes = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return minutesToPxTimeline(minutes)
}
