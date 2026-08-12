'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { listPlanArchivedLists, restoreArchivedList } from '@/api/lists/actions'
import { type List } from '@/payload-types'
import { toast } from 'sonner'
import { useRestorePrompt } from '@/components/ui/restore-prompt-context'

export const useDeleteList = (list: List) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { openPrompt } = useRestorePrompt()

  const mutation = useMutation({
    mutationFn: () => api.lists.delete(list.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['lists'] })
      const previousLists = queryClient.getQueryData(['lists'])
      queryClient.setQueryData<{ docs: List[] }>(['lists'], (old) => {
        if (!old) return old
        return { ...old, docs: old.docs.filter((l) => l.id !== list.id) }
      })
      router.push('/lists/today')
      return { previousLists }
    },
    onSuccess: async (result, _vars, context) => {
      if (!result.ok) {
        if (context?.previousLists) {
          queryClient.setQueryData(['lists'], context.previousLists)
        }
        router.push(`/lists/${list.slug}`)
        return
      }
      toast.info('List successfully removed', {
        description: `This list and all associated tasks have been deleted.`,
      })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })

      const { docs: archived } = await listPlanArchivedLists()
      if (archived.length > 0) {
        openPrompt({
          title: 'Restore an archived list?',
          description:
            'You have lists that were archived when your plan changed. Restore one now that you have room.',
          items: archived.map((l) => ({
            id: l.id,
            label: l.name,
            color: l.category?.color ?? '#8b5cf6',
          })),
          onRestore: async (id) => {
            const restoreResult = await restoreArchivedList(id)
            if (restoreResult.ok) {
              queryClient.invalidateQueries({ queryKey: ['lists'] })
              queryClient.invalidateQueries({ queryKey: ['tasks'] })
              toast.info('List restored')
            }
            return restoreResult
          },
        })
      }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(['lists'], context.previousLists)
      }
      router.push(`/lists/${list.slug}`)
      toast.error('Failed to delete list', {
        description: 'Something went wrong. Please try again.',
      })
    },
  })

  return {
    handleDelete: () => mutation.mutate(),
    isPending: mutation.isPending,
  }
}
