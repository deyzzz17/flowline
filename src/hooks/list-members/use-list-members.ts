'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useLivePollInterval } from '@/components/providers/realtime-provider'

export const useListMembers = (listId: number) => {
  const refetchInterval = useLivePollInterval('slow')
  const { data, isLoading } = useQuery({
    queryKey: ['list-members', listId],
    queryFn: () => api.listMembers.listForList(listId),
    enabled: !!listId,
    refetchInterval,
  })

  return { members: data ?? [], isLoading }
}
