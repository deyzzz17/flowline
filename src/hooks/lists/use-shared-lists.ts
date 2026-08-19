'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

export const useSharedLists = () => {
  const { data } = useQuery({
    queryKey: ['lists', 'shared-with-me'],
    queryFn: () => api.listMembers.listSharedWithMe(),
  })

  return data ?? []
}
