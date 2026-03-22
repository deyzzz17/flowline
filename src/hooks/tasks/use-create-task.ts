'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (task: { title: string; description?: string }) => api.tasks.create(task),

    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const previous = queryClient.getQueryData<{ docs: Task[] }>(['tasks'])

      const tempTask: Task = {
        id: -Date.now(),
        title: newTask.title,
        description: newTask.description ?? '',
        status: 'active',
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<{ docs: Task[] }>(['tasks'], (old) => ({
        ...old!,
        docs: [tempTask, ...(old?.docs ?? [])],
      }))

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

export function useEditTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: { title: string; description?: string } }) =>
      api.tasks.edit(id, draft),

    onMutate: async ({ id, draft }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const previous = queryClient.getQueryData<{ docs: Task[] }>(['tasks'])

      queryClient.setQueryData<{ docs: Task[] }>(['tasks'], (old) => ({
        ...old!,
        docs: old!.docs.map((task) =>
          task.id === id
            ? {
                ...task,
                title: draft.title.trim() === '' ? task.title : draft.title,
                description: draft.description ?? task.description,
              }
            : task,
        ),
      }))

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
