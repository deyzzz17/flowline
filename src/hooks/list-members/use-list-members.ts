'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'

export const useListMembers = (listId: number) => {
  const { data, isLoading } = useQuery({
    queryKey: ['list-members', listId],
    queryFn: () => api.listMembers.listForList(listId),
    enabled: !!listId,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  return { members: data ?? [], isLoading }
}
