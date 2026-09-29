'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useLivePollInterval } from '@/components/providers/realtime-provider'

export const LIST_INVITES_KEY = ['list-invites', 'mine']

export const useListInvites = () => {
  const refetchInterval = useLivePollInterval('live')
  const { data } = useQuery({
    queryKey: LIST_INVITES_KEY,
    queryFn: () => api.listMembers.myInvites(),
    refetchOnWindowFocus: true,
    refetchInterval,
  })

  return data ?? []
}
