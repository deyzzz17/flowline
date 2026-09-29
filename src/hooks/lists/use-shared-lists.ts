'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useLivePollInterval } from '@/components/providers/realtime-provider'

export const useSharedLists = () => {
  const slowInterval = useLivePollInterval('slow')
  const { data } = useQuery({
    queryKey: ['lists', 'shared-with-me'],
    queryFn: () => api.listMembers.listSharedWithMe(),
    // Only poll once there's at least one shared list to keep in sync —
    // most users have none, so this avoids polling for the common case.
    // Being added to / removed from a list is pushed on the user channel.
    refetchInterval: (query) => ((query.state.data?.length ?? 0) > 0 ? slowInterval : false),
  })

  return data ?? []
}
