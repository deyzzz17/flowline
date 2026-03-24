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

      queryClient.setQueryData<{ docs: Task[] }>(['tasks'], (old) => ({
        ...old!,
        docs: old!.docs.map((task) => {
          if (task.id !== taskId) return task

          const updatedSubtasks = (task.subtasks ?? []).map((s: Subtask, i: number) =>
            i === subtaskIndex ? { ...s, done: !s.done } : s,
          )

          const allDone =
            updatedSubtasks.length > 0 && updatedSubtasks.every((s: Subtask) => s.done)

          return {
            ...task,
            subtasks: updatedSubtasks,
            ...(allDone && task.status !== 'completed' && { status: 'completed' }),
          }
        }),
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