'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useLivePollInterval } from '@/components/providers/realtime-provider'

export const CUSTOM_ROLES_QUERY_KEY = ['custom-roles']

export const useCustomRoles = (enabled = true) => {
  const refetchInterval = useLivePollInterval('slow')
  const { data, isLoading } = useQuery({
    queryKey: CUSTOM_ROLES_QUERY_KEY,
    queryFn: () => api.customRoles.list(),
    enabled,
    refetchInterval,
  })

  return { customRoles: data ?? [], isLoading }
}
