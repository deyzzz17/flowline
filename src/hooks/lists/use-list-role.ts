'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import type { ListRole } from '@/lib/list-roles'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'

// Seeded with the server-resolved role so there's no permission flash on
// load; polls (shared lists only) so an admin's role change or removal
// takes effect for the affected member without them refreshing.
export const useListRole = (listId: number, initialRole: ListRole, isShared: boolean): ListRole => {
  const { data } = useQuery({
    queryKey: ['lists', 'role', listId],
    queryFn: () => api.lists.role(listId),
    initialData: initialRole,
    refetchInterval: isShared ? SHARED_LIST_POLL_INTERVAL_MS : false,
  })

  return data
}
