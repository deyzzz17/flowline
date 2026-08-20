'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'

export const useSharedLists = () => {
  const { data } = useQuery({
    queryKey: ['lists', 'shared-with-me'],
    queryFn: () => api.listMembers.listSharedWithMe(),
    // Only poll once there's at least one shared list to keep in sync —
    // most users have none, so this avoids polling for the common case.
    refetchInterval: (query) =>
      (query.state.data?.length ?? 0) > 0 ? SHARED_LIST_POLL_INTERVAL_MS : false,
  })

  return data ?? []
}
