'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

export const useListMembers = (listId: number) => {
  const { data, isLoading } = useQuery({
    queryKey: ['list-members', listId],
    queryFn: () => api.listMembers.listForList(listId),
    enabled: !!listId,
  })

  return { members: data ?? [], isLoading }
}
