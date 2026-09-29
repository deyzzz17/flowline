'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { api } from '@/api'
import type { Task } from '@/payload-types'
import { patchTaskInCaches } from './task-cache'

type Subtask = NonNullable<Task['subtasks']>[number]

function updateTaskInCache(
  old: { docs: Task[] } | undefined,
  id: number,
  status: 'active' | 'completed',
) {
  if (!old?.docs) return old
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

  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'completed' }) =>
      api.tasks.toggleStatus(id, status),

    onMutate: async ({ id, status }) => {
      setPendingIds((prev) => new Set(prev).add(id))

      // Cancel any in-flight refetch for these keys first — otherwise a stale
      // response that was already on the wire can land after our optimistic
      // write and silently overwrite it, which looks like the checkbox
      // flipping, reverting, then flipping again.
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const queries = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
      const previousData = queries.map(([queryKey, data]) => ({ queryKey, data }))

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) =>
          updateTaskInCache(old, id, status),
        )
      })

      return { previousData, id }
    },

    onError: (_err, _vars, context) => {
      context?.previousData?.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey as string[], data)
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },

    onSuccess: (result, { id, status }, context) => {
      if (!result.ok) {
        context?.previousData?.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey as string[], data)
        })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        return
      }
      // Re-assert the saved state: a refetch that started while the save was
      // in flight (a realtime/focus refresh) can land with the old status
      // and silently uncheck the box again.
      const nextStatus: Task['status'] = status === 'active' ? 'completed' : 'active'
      patchTaskInCaches(queryClient, id, {
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
      })
      queryClient.invalidateQueries({ queryKey: ['list-analytics'] })
    },

    onSettled: (_data, _err, _vars, context) => {
      if (context?.id !== undefined) {
        setPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(context.id)
          return next
        })
      }
    },
  })

  const isTaskPending = useCallback((id: number) => pendingIds.has(id), [pendingIds])

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isTaskPending,
  }
}
