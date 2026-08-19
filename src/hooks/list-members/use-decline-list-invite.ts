'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { ListInvite } from '@/api/list-members/actions'
import { LIST_INVITES_KEY } from './use-list-invites'

export const useDeclineListInvite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inviteId: number) => api.listMembers.decline(inviteId),
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
  })
}
