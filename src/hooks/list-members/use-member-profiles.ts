'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

export const useListMemberProfiles = (listId: number | undefined, enabled = true) => {
  const { data } = useQuery({
    queryKey: ['list-members', 'profiles', listId],
    queryFn: () => api.listMembers.memberProfiles(listId as number),
    enabled: !!listId && enabled,
  })

  return data ?? []
}
