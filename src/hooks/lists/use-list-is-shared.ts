'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

// Seeded with the server-resolved value so there's no flash on load. The
// list-detail page never queries ['lists'] itself, but the sidebar (always
// mounted) does — this just subscribes to that same cache entry, so adding
// the first member to a solo workspace list (via the edit dialog) flips this
// to `true` the moment useInviteMember's invalidateQueries(['lists']) lands,
// without requiring a page reload.
export const useListIsShared = (listId: number, initialIsShared: boolean): boolean => {
  const { data } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.lists.list(),
  })

  const list = data?.docs.find((l) => l.id === listId)
  return list ? !!list.isShared : initialIsShared
}
