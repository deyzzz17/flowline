'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

export const LIST_INVITES_KEY = ['list-invites', 'mine']

export const useListInvites = () => {
  const { data } = useQuery({
    queryKey: LIST_INVITES_KEY,
    queryFn: () => api.listMembers.myInvites(),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  return data ?? []
}
