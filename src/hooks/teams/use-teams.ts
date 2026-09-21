'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'

export const TEAMS_QUERY_KEY = ['teams']
export const TEAMS_ACCESS_QUERY_KEY = ['teams', 'access']

export const useTeamsAccess = (enabled = true) => {
  const { data, isLoading } = useQuery({
    queryKey: TEAMS_ACCESS_QUERY_KEY,
    queryFn: () => api.teams.getAccess(),
    enabled,
  })
  return { hasAccess: data?.hasAccess ?? false, ownerPlan: data?.ownerPlan ?? null, isLoading }
}

export const useTeams = (enabled = true) => {
  const { data, isLoading } = useQuery({
    queryKey: TEAMS_QUERY_KEY,
    queryFn: () => api.teams.list(),
    enabled,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })
  return { teams: data ?? [], isLoading }
}
