'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { TasksCache, removeTaskFromCache } from './utils/task-cache'

export const useDeleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.tasks.trash(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<TasksCache>(['tasks'])
      queryClient.setQueryData<TasksCache>(['tasks'], (old) => removeTaskFromCache(old, id))
      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['tasks'], context.previous)
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
