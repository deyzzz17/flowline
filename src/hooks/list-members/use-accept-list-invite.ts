'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { ListInvite } from '@/api/list-members/actions'
import { LIST_INVITES_KEY } from './use-list-invites'

export const useAcceptListInvite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inviteId: number) => api.listMembers.accept(inviteId),
    onMutate: async (inviteId) => {
      await queryClient.cancelQueries({ queryKey: LIST_INVITES_KEY })
      const previous = queryClient.getQueryData<ListInvite[]>(LIST_INVITES_KEY)
      queryClient.setQueryData<ListInvite[]>(LIST_INVITES_KEY, (old) =>
        (old ?? []).filter((i) => i.id !== inviteId),
      )
      return { previous }
    },
    onError: (_error, _inviteId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LIST_INVITES_KEY, context.previous)
      }
    },
    onSuccess: (result) => {
      if (!result.ok) return
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['lists', 'shared-with-me'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
