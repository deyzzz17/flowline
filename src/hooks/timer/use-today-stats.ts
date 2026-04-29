'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTimerAnalytics } from '@/api/timer/actions'

function formatSeconds(s: number): string {
  if (s === 0) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

export const useTodayStats = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['timer-analytics', 'day'],
    queryFn: () => getTimerAnalytics('day'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const stats = useMemo(() => {
    if (!data) return { sessions: '—', focusTime: '—', longest: '—' }
    return {
      sessions: data.totalSessions > 0 ? String(data.totalSessions) : '—',
      focusTime: formatSeconds(data.totalSeconds),
      longest: formatSeconds(data.longestSessionSeconds ?? 0),
    }
  }, [data])

  return { stats, isLoading }
}
