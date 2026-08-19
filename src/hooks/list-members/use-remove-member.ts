'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { ListMemberEntry } from '@/api/list-members/actions'

export const useRemoveMember = (listId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: number) => api.listMembers.remove(listId, memberId),
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: ['list-members', listId] })
      const previous = queryClient.getQueryData<ListMemberEntry[]>(['list-members', listId])
      queryClient.setQueryData<ListMemberEntry[]>(['list-members', listId], (old) =>
        (old ?? []).filter((m) => m.id !== memberId),
      )
      return { previous }
    },
    onError: (_error, _memberId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['list-members', listId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['list-members', listId] })
    },
  })
}
