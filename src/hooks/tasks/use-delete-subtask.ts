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
    onMutate: async ({ taskId, subtaskIndex }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const queries = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
      const previousData = queries.map(([queryKey, data]) => ({ queryKey, data }))

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) => {
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
                ...(task.status === 'completed' &&
                  updatedSubtasks.length === 0 && { status: 'active' }),
              }
            }),
          }
        })
      })

      return { previousData }
    },
    onError: (_err, _vars, context) => {
      context?.previousData?.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey as string[], data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
