'use client'

import { useMemo } from 'react'

export function useTimeFormat() {
  const is24h = useMemo(() => {
    try {
      const formatted = new Intl.DateTimeFormat(navigator.language, {
        hour: 'numeric',
      }).format(new Date(2000, 0, 1, 13, 0, 0))
      return !/am|pm/i.test(formatted)
    } catch {
      return true
    }
  }, [])

  const formatTime = useMemo(
    () =>
      (date: Date): string => {
        return new Intl.DateTimeFormat(navigator.language, {
          hour: 'numeric',
          minute: '2-digit',
        }).format(date)
      },
    [],
  )

  const formatHourLabel = useMemo(
    () =>
      (hour: number): string => {
        const d = new Date(2000, 0, 1, hour, 0, 0)
        return new Intl.DateTimeFormat(navigator.language, {
          hour: 'numeric',
        }).format(d)
      },
    [],
  )

  return { is24h, formatTime, formatHourLabel }
}
