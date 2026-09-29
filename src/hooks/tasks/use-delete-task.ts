'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'
import { removeTaskFromCaches } from './task-cache'

export const useDeleteTask = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.tasks.trash(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const queries = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
      const previousData = queries.map(([queryKey, data]) => ({ queryKey, data }))

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) => {
          if (!old?.docs) return old
          return {
            ...old,
            docs: old.docs.filter((task) => task.id !== id),
          }
        })
      })

      return { previousData }
    },
    // Already removed optimistically — nothing to refetch on success.
    onSuccess: (result, id, context) => {
      if (result.ok) {
        removeTaskFromCaches(queryClient, id)
        return
      }
      context?.previousData?.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey as string[], data)
      })
    },
    onError: (_err, _vars, context) => {
      context?.previousData?.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey as string[], data)
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
