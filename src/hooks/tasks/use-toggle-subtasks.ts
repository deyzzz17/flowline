'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

type Subtask = NonNullable<Task['subtasks']>[number]

export function useToggleSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      subtaskIndex,
      taskStatus,
    }: {
      taskId: number
      subtaskIndex: number
      taskStatus: Task['status']
    }) =>
      taskStatus === 'completed'
        ? api.tasks.uncompleteSubtask(taskId, subtaskIndex)
        : api.tasks.toggleSubtask(taskId, subtaskIndex),

    onMutate: ({ taskId, subtaskIndex, taskStatus }) => {
      const queries = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
      const previousData = queries.map(([queryKey, data]) => ({ queryKey, data }))

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) => {
          if (!old) return old
          return {
            ...old,
            docs: old.docs.map((task) => {
              if (task.id !== taskId) return task

              if (taskStatus === 'completed') {
                const updatedSubtasks = (task.subtasks ?? []).map((s: Subtask, i: number) =>
                  i === subtaskIndex ? { ...s, done: false } : s,
                )
                return {
                  ...task,
                  status: 'active' as Task['status'],
                  completedAt: null,
                  subtasks: updatedSubtasks,
                }
              }

              const updatedSubtasks = (task.subtasks ?? []).map((s: Subtask, i: number) =>
                i === subtaskIndex ? { ...s, done: !s.done } : s,
              )
              const allDone =
                updatedSubtasks.length > 0 && updatedSubtasks.every((s: Subtask) => s.done)
              return {
                ...task,
                subtasks: updatedSubtasks,
                ...(allDone &&
                  task.status !== 'completed' && {
                    status: 'completed' as Task['status'],
                  }),
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
      queryClient.invalidateQueries({ queryKey: ['list-analytics'] })
    },
  })
}

export function useCompleteTaskWithSubtasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: number) => api.tasks.completeWithSubtasks(taskId),

    onMutate: (taskId) => {
      const queries = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
      const previousData = queries.map(([queryKey, data]) => ({ queryKey, data }))

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) => {
          if (!old) return old
          return {
            ...old,
            docs: old.docs.map((task) => {
              if (task.id !== taskId) return task
              return {
                ...task,
                status: 'completed' as Task['status'],
                subtasks: (task.subtasks ?? []).map((s: Subtask) => ({ ...s, done: true })),
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
      queryClient.invalidateQueries({ queryKey: ['list-analytics'] })
    },
  })
}
