'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { listMembersQueryKey } from './use-list-members'
import type { ListMembersOverview } from '@/api/list-members/actions'

export const useRemoveMember = (listId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: number) => api.listMembers.remove(listId, memberId),
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: ['list-members', listId] })
      const previous = queryClient.getQueryData<ListMembersOverview>(listMembersQueryKey(listId))
      queryClient.setQueryData<ListMembersOverview>(listMembersQueryKey(listId), (old) =>
        old ? { ...old, members: old.members.filter((m) => m.id !== memberId) } : old,
      )
      return { previous }
    },
    onError: (_error, _memberId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listMembersQueryKey(listId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['list-members', listId] })
    },
  })
}
