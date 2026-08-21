'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { listPlanArchivedLists, restoreArchivedList } from '@/api/lists/actions'
import {
  listPlanArchivedSharedLists,
  restoreArchivedSharedList,
} from '@/api/list-members/actions'
import { type List } from '@/payload-types'
import { toast } from 'sonner'
import { useRestorePrompt } from '@/components/ui/restore-prompt-context'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import { isPlanUnlimited } from '@/lib/plan-limits'

const FALLBACK_LISTS_LIMIT = 3
const FALLBACK_SHARED_LISTS_LIMIT = 3

export const useDeleteList = (list: List) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { openPrompt } = useRestorePrompt()
  const planLimits = usePlanLimits()

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

      const isShared = !!list.isShared
      const { docs: archived } = isShared
        ? await listPlanArchivedSharedLists()
        : await listPlanArchivedLists()
      if (archived.length === 0) return

      const listsLimit = isShared
        ? (planLimits?.limits.sharedLists ?? FALLBACK_SHARED_LISTS_LIMIT)
        : (planLimits?.limits.lists ?? FALLBACK_LISTS_LIMIT)
      const limitField = isShared ? 'sharedLists' : 'lists'
      const currentLists = queryClient.getQueryData<{ docs: List[] }>(['lists'])
      const activeCount = isShared
        ? (currentLists?.docs.filter((l) => l.isShared).length ?? 0)
        : (currentLists?.docs.filter((l) => !l.isShared).length ?? 0)
      const room =
        planLimits && isPlanUnlimited(planLimits.plan, limitField)
          ? archived.length
          : Math.max(0, listsLimit - activeCount)

      if (room <= 0) return

      openPrompt({
        title: isShared ? 'Restore an archived shared list?' : 'Restore an archived list?',
        description: isShared
          ? 'You have shared lists that were archived when your plan changed. Restore some now that you have room.'
          : 'You have lists that were archived when your plan changed. Restore some now that you have room.',
        items: archived.map((l) => ({
          id: l.id,
          label: l.name,
          color: l.category?.color ?? '#8b5cf6',
        })),
        maxSelectable: room,
        onConfirm: async (ids) => {
          const restore = isShared ? restoreArchivedSharedList : restoreArchivedList
          const results = await Promise.all(ids.map((id) => restore(id)))
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
