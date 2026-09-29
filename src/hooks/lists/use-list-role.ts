'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import type { ListRole } from '@/lib/list-roles'
import { useLivePollInterval } from '@/components/providers/realtime-provider'

// Seeded with the server-resolved role so there's no permission flash on
// load; refreshed by a push on the list's channel (or a slow poll, shared
// lists only) so an admin's role change or removal takes effect for the
// affected member without them refreshing.
export const useListRole = (listId: number, initialRole: ListRole, isShared: boolean): ListRole => {
  const slowInterval = useLivePollInterval('slow')
  const { data } = useQuery({
    queryKey: ['lists', 'role', listId],
    queryFn: () => api.lists.role(listId),
    initialData: initialRole,
    refetchInterval: isShared ? slowInterval : false,
  })

  return data
}
