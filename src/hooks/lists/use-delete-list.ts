'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { type List } from '@/payload-types'
import { toast } from 'sonner'

export const useDeleteList = (list: List) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => api.lists.delete(list.id),
    onSuccess: (result) => {
      if (!result.ok) return
      toast.info('List successfully removed', {
        description: `This list and all associated tasks have been deleted.`,
      })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      router.push('/lists/today')
    },
  })

  return {
    handleDelete: () => mutation.mutate(),
    isPending: mutation.isPending,
  }
}
