'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { listMembersQueryKey } from './use-list-members'
import type { ListMembersOverview, ListMemberRole } from '@/api/list-members/actions'

export const useChangeMemberRole = (listId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: ListMemberRole }) =>
      api.listMembers.changeRole(listId, memberId, role),
    onMutate: async ({ memberId, role }) => {
      await queryClient.cancelQueries({ queryKey: ['list-members', listId] })
      const previous = queryClient.getQueryData<ListMembersOverview>(listMembersQueryKey(listId))
      queryClient.setQueryData<ListMembersOverview>(listMembersQueryKey(listId), (old) =>
        old
          ? { ...old, members: old.members.map((m) => (m.id === memberId ? { ...m, role } : m)) }
          : old,
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listMembersQueryKey(listId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['list-members', listId] })
    },
  })
}
