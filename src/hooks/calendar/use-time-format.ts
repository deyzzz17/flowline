'use client'

import { useMemo } from 'react'

export function useTimeFormat() {
  const is24h = useMemo(() => {
    try {
      const formatted = new Intl.DateTimeFormat(navigator.language, {
        hour: 'numeric',
        hour12: undefined,
      }).format(new Date(2000, 0, 1, 13, 0, 0))
      return !/am|pm/i.test(formatted)
    } catch {
      return true
    }
  }, [])

  const formatTime = useMemo(
    () =>
      (date: Date, includeMinutes = true): string => {
        return new Intl.DateTimeFormat(navigator.language, {
          hour: 'numeric',
          minute: includeMinutes ? '2-digit' : undefined,
          hour12: !is24h ? false : undefined,
        }).format(date)
      },
    [is24h],
  )

  const formatHourLabel = useMemo(
    () =>
      (hour: number): string => {
        const d = new Date(2000, 0, 1, hour, 0, 0)
        return new Intl.DateTimeFormat(navigator.language, {
          hour: 'numeric',
          hour12: !is24h ? false : undefined,
        }).format(d)
      },
    [is24h],
  )

  return { is24h, formatTime, formatHourLabel }
}
