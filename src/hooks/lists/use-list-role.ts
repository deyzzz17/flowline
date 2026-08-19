'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import type { List } from '@/payload-types'

export type ListRole = 'admin' | 'editor' | 'reader' | null

export const useListRole = (listId: number | undefined): ListRole => {
  const { data: ownedLists } = useQuery({ queryKey: ['lists'], queryFn: () => api.lists.list() })
  const { data: sharedLists } = useQuery({
    queryKey: ['lists', 'shared-with-me'],
    queryFn: () => api.listMembers.listSharedWithMe(),
  })

  if (!listId) return null

  const isOwned = (ownedLists?.docs ?? []).some((l: List) => l.id === listId)
  if (isOwned) return 'admin'

  const shared = (sharedLists ?? []).find((l) => l.id === listId)
  return shared?.myRole ?? null
}
