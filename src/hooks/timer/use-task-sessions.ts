'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

function formatSeconds(s: number): string {
  if (s === 0) return '0m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

export const useTaskSessions = (taskId: number, enabled = true) => {
  const { data, isLoading } = useQuery({
    queryKey: ['task-sessions', taskId],
    queryFn: () => api.timer.sessions.getTasks(taskId),
    staleTime: 60_000,
    enabled,
  })

  return {
    totalSessions: data?.totalSessions ?? 0,
    focusTime: formatSeconds(data?.totalSeconds ?? 0),
    totalSeconds: data?.totalSeconds ?? 0,
    isLoading,
  }
}
