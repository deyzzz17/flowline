'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useLivePollInterval } from '@/components/providers/realtime-provider'

// 'with-creator': the response shape changed (it used to be the bare member
// array) — a new key keeps an old persisted cache entry from being read.
// Invalidating ['list-members', listId] still matches it by prefix.
export const listMembersQueryKey = (listId: number) =>
  ['list-members', listId, 'with-creator'] as const

export const useListMembers = (listId: number) => {
  const refetchInterval = useLivePollInterval('slow')
  const { data, isLoading } = useQuery({
    queryKey: listMembersQueryKey(listId),
    queryFn: () => api.listMembers.listForList(listId),
    enabled: !!listId,
    refetchInterval,
  })

  return {
    creator: data?.creator ?? null,
    viewerId: data?.viewerId ?? null,
    members: data?.members ?? [],
    isLoading,
  }
}
