import { api } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TasksCache, updateTaskInCache } from './utils/task-cache'

export const useEditTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: { title: string; description?: string } }) =>
      api.tasks.edit(id, draft),

    onMutate: async ({ id, draft }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<TasksCache>(['tasks'])

      queryClient.setQueryData<TasksCache>(['tasks'], (old) =>
        updateTaskInCache(old, (task) =>
          task.id === id
            ? {
                ...task,
                title: draft.title.trim() === '' ? task.title : draft.title,
                description: draft.description ?? task.description,
              }
            : task,
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
