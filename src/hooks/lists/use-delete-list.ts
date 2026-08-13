'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { listPlanArchivedLists, restoreArchivedList } from '@/api/lists/actions'
import { type List } from '@/payload-types'
import { toast } from 'sonner'
import { useRestorePrompt } from '@/components/ui/restore-prompt-context'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import { isPlanUnlimited } from '@/lib/plan-limits'

const FALLBACK_LISTS_LIMIT = 3

export const useDeleteList = (list: List) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { openPrompt } = useRestorePrompt()
  const planLimits = usePlanLimits()

  const mutation = useMutation({
    mutationFn: () => api.lists.delete(list.id),
    onMutate: async () => {
      const archivedPromise = listPlanArchivedLists()

      await queryClient.cancelQueries({ queryKey: ['lists'] })
      const previousLists = queryClient.getQueryData(['lists'])
      queryClient.setQueryData<{ docs: List[] }>(['lists'], (old) => {
        if (!old) return old
        return { ...old, docs: old.docs.filter((l) => l.id !== list.id) }
      })
      router.push('/lists/today')
      return { previousLists, archivedPromise }
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

      const { docs: archived } = await context!.archivedPromise
      if (archived.length === 0) return

      const listsLimit = planLimits?.limits.lists ?? FALLBACK_LISTS_LIMIT
      const currentLists = queryClient.getQueryData<{ docs: List[] }>(['lists'])
      const activeCount = currentLists?.docs.length ?? 0
      const room =
        planLimits && isPlanUnlimited(planLimits.plan, 'lists')
          ? archived.length
          : Math.max(0, listsLimit - activeCount)

      if (room <= 0) return

      openPrompt({
        title: 'Restore an archived list?',
        description:
          'You have lists that were archived when your plan changed. Restore some now that you have room.',
        items: archived.map((l) => ({
          id: l.id,
          label: l.name,
          color: l.category?.color ?? '#8b5cf6',
        })),
        maxSelectable: room,
        onConfirm: async (ids) => {
          const results = await Promise.all(ids.map((id) => restoreArchivedList(id)))
          const allOk = results.every((r) => r.ok)

          queryClient.invalidateQueries({ queryKey: ['lists'] })
          queryClient.invalidateQueries({ queryKey: ['tasks'] })

          if (allOk) {
            toast.info(ids.length > 1 ? 'Lists restored' : 'List restored')
          } else {
            toast.error('Some lists could not be restored', {
              description: 'Please try again.',
            })
          }

          return { ok: allOk }
        },
      })
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
