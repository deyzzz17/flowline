'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'

export const CUSTOM_ROLES_QUERY_KEY = ['custom-roles']

export const useCustomRoles = (enabled = true) => {
  const { data, isLoading } = useQuery({
    queryKey: CUSTOM_ROLES_QUERY_KEY,
    queryFn: () => api.customRoles.list(),
    enabled,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  return { customRoles: data ?? [], isLoading }
}
