'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useLivePollInterval } from '@/components/providers/realtime-provider'

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
  const refetchInterval = useLivePollInterval('slow')
  const { data, isLoading } = useQuery({
    queryKey: TEAMS_QUERY_KEY,
    queryFn: () => api.teams.list(),
    enabled,
    refetchInterval,
  })
  return { teams: data ?? [], isLoading }
}
