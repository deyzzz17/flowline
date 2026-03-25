'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

type Subtask = NonNullable<Task['subtasks']>[number]

export function useToggleSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, subtaskIndex }: { taskId: number; subtaskIndex: number }) =>
      api.tasks.toggleSubtask(taskId, subtaskIndex),

    onMutate: async ({ taskId, subtaskIndex }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const previous = queryClient.getQueryData<{ docs: Task[] }>(['tasks'])

      queryClient.setQueryData<{ docs: Task[] }>(['tasks'], (old) => {
        if (!old) return old

        return {
          ...old,
          docs: old.docs.map((task) => {
            if (task.id !== taskId) return task

            const currentSubtasks = task.subtasks ?? []
            const updatedSubtasks = currentSubtasks.map((s: Subtask, i: number) =>
              i === subtaskIndex ? { ...s, done: !s.done } : s,
            )

            const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.done)

            let nextStatus: 'active' | 'completed' = 'active'
            if (allDone) {
              nextStatus = 'completed'
            } else if (task.status === 'completed' && !allDone) {
              nextStatus = 'active'
            } else {
              nextStatus = task.status as 'active' | 'completed'
            }

            return {
              ...task,
              subtasks: updatedSubtasks,
              status: nextStatus,
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
