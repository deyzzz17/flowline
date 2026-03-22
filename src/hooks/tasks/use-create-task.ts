'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

type TasksCache = Awaited<ReturnType<typeof api.tasks.list>>

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (task: { title: string; description?: string }) => api.tasks.create(task),

    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const previous = queryClient.getQueryData<TasksCache>(['tasks'])

      const tempTask: Task = {
        id: -Date.now(),
        title: newTask.title,
        description: newTask.description ?? '',
        status: 'active',
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<{ docs: Task[] }>(['tasks'], (old) => {
        if (!old) return old
        return {
          ...old,
          docs: [tempTask, ...old.docs],
        }
      })

      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tasks'], context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
