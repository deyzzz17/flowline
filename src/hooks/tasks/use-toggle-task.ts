'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

export function useToggleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'completed' }) =>
      api.tasks.toggleStatus(id, status),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<{ docs: Task[] }>(['tasks'])

      queryClient.setQueryData<{ docs: Task[] }>(['tasks'], (old) => {
        if (!old) return old

        return {
          ...old,
          docs: old.docs.map((task) => {
            if (task.id !== id) return task

            let nextStatus: Task['status'] = 'active'

            if (status === 'active') {
              nextStatus = 'completed'
            } else if (status === 'completed') {
              nextStatus = 'active'
            }

            const hasSubtasks = (task.subtasks ?? []).length > 0

            return {
              ...task,
              status: nextStatus,
              ...(nextStatus === 'active' &&
                hasSubtasks && {
                  subtasks: (task.subtasks ?? []).map((s) => ({ ...s, done: false })),
                }),
              ...(nextStatus !== 'active' &&
                hasSubtasks && {
                  subtasks: (task.subtasks ?? []).map((s) => ({ ...s, done: true })),
                }),
            }
          }),
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
