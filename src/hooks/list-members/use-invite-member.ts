'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { ListMemberRole } from '@/api/list-members/actions'

export const useInviteMember = (listId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ListMemberRole }) =>
      api.listMembers.invite(listId, userId, role),
    onSuccess: (result) => {
      if (!result.ok) return
      queryClient.invalidateQueries({ queryKey: ['list-members', listId] })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })
}
