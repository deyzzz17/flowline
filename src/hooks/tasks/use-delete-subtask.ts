'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

type Subtask = NonNullable<Task['subtasks']>[number]

export function useDeleteSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, subtaskIndex }: { taskId: number; subtaskIndex: number }) =>
      api.tasks.deleteSubtask(taskId, subtaskIndex),

    onMutate: ({ taskId, subtaskIndex }) => {
      const previous = queryClient.getQueryData<{ docs: Task[] }>(['tasks'])

      queryClient.setQueryData<{ docs: Task[] }>(['tasks'], (old) => {
        if (!old) return old
        return {
          ...old,
          docs: old.docs.map((task) => {
            if (task.id !== taskId) return task

            const updatedSubtasks = (task.subtasks ?? []).filter(
              (_: Subtask, i: number) => i !== subtaskIndex,
            )

            return {
              ...task,
              subtasks: updatedSubtasks,
              ...(task.status === 'completed' && updatedSubtasks.length === 0 && {
                status: 'active',
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