import { api } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TasksCache, updateTaskInCache } from './utils/task-cache'

export const useSoftDelete = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.tasks.softDelete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<TasksCache>(['tasks'])
      queryClient.setQueryData<TasksCache>(['tasks'], (old) =>
        updateTaskInCache(old, (task) => (task.id === id ? { ...task, status: 'deleted' } : task)),
      )
      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['tasks'], context.previous)
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
