'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

type Subtask = NonNullable<Task['subtasks']>[number]

export function useToggleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'completed' }) =>
      api.tasks.toggleStatus(id, status),

    onMutate: ({ id, status }) => {
      const previous = queryClient.getQueryData<{ docs: Task[] }>(['tasks'])

      queryClient.setQueryData<{ docs: Task[] }>(['tasks'], (old) => {
        if (!old) return old
        return {
          ...old,
          docs: old.docs.map((task) => {
            if (task.id !== id) return task

            const nextStatus: Task['status'] = status === 'active' ? 'completed' : 'active'
            const hasSubtasks = (task.subtasks ?? []).length > 0

            return {
              ...task,
              status: nextStatus,
              ...(nextStatus === 'active' &&
                hasSubtasks && {
                  subtasks: (task.subtasks ?? []).map((s: Subtask) => ({ ...s, done: false })),
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
