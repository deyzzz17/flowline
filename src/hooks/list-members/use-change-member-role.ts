'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { ListMemberEntry, ListMemberRole } from '@/api/list-members/actions'

export const useChangeMemberRole = (listId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: ListMemberRole }) =>
      api.listMembers.changeRole(listId, memberId, role),
    onMutate: async ({ memberId, role }) => {
      await queryClient.cancelQueries({ queryKey: ['list-members', listId] })
      const previous = queryClient.getQueryData<ListMemberEntry[]>(['list-members', listId])
      queryClient.setQueryData<ListMemberEntry[]>(['list-members', listId], (old) =>
        (old ?? []).map((m) => (m.id === memberId ? { ...m, role } : m)),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['list-members', listId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['list-members', listId] })
    },
  })
}
