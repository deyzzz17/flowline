'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { updateTaskInCache, TasksCache } from './utils/task-cache'

export const useToggleTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'completed' }) =>
      api.tasks.toggleStatus(id, status),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<TasksCache>(['tasks'])
      queryClient.setQueryData<TasksCache>(['tasks'], (old) =>
        updateTaskInCache(old, (task) =>
          task.id === id ? { ...task, status: status === 'active' ? 'completed' : 'active' } : task,
        ),
      )
      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['tasks'], context.previous)
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
