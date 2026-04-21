'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

type Subtask = NonNullable<Task['subtasks']>[number]

function updateTaskInCache(
  old: { docs: Task[] } | undefined,
  id: number,
  status: 'active' | 'completed',
) {
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
}

export function useToggleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'completed' }) =>
      api.tasks.toggleStatus(id, status),
    onMutate: ({ id, status }) => {
      const queries = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
      const previousData = queries.map(([queryKey, data]) => ({ queryKey, data }))

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) =>
          updateTaskInCache(old, id, status),
        )
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
