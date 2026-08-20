'use client'

import { useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

type Subtask = NonNullable<Task['subtasks']>[number]

function subtaskKey(taskId: number, subtaskIndex: number) {
  return `${taskId}-${subtaskIndex}`
}

export function useToggleSubtask() {
  const queryClient = useQueryClient()

  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pendingStates = useRef<Map<string, { done: boolean; taskStatus: Task['status'] }>>(
    new Map(),
  )

  const toggle = useCallback(
    async ({
      taskId,
      subtaskIndex,
      taskStatus,
    }: {
      taskId: number
      subtaskIndex: number
      taskStatus: Task['status']
    }) => {
      const key = subtaskKey(taskId, subtaskIndex)

      // See useToggleTask for why this matters: without canceling in-flight
      // refetches first, a stale response can land after our optimistic
      // write and overwrite it, causing a visible check/uncheck/check flicker.
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const queries = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
      let currentDone = false
      for (const [, data] of queries) {
        const task = data?.docs.find((t) => t.id === taskId)
        if (task) {
          currentDone = (task.subtasks ?? [])[subtaskIndex]?.done ?? false
          break
        }
      }
      const newDone = !currentDone

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) => {
          if (!old) return old
          return {
            ...old,
            docs: old.docs.map((task) => {
              if (task.id !== taskId) return task
              const updatedSubtasks = (task.subtasks ?? []).map((s: Subtask, i: number) =>
                i === subtaskIndex ? { ...s, done: newDone } : s,
              )
              const allDone =
                updatedSubtasks.length > 0 && updatedSubtasks.every((s: Subtask) => s.done)
              return {
                ...task,
                subtasks: updatedSubtasks,
                ...(allDone && task.status !== 'completed'
                  ? { status: 'completed' as Task['status'] }
                  : !allDone && task.status === 'completed' && taskStatus !== 'completed'
                    ? {}
                    : {}),
              }
            }),
          }
        })
      })

      pendingStates.current.set(key, { done: newDone, taskStatus })

      const existing = timers.current.get(key)
      if (existing) clearTimeout(existing)

      const timer = setTimeout(async () => {
        timers.current.delete(key)
        const target = pendingStates.current.get(key)
        pendingStates.current.delete(key)
        if (!target) return

        const snapshots = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
        const previousData = snapshots.map(([qk, data]) => ({ queryKey: qk, data }))

        try {
          if (target.taskStatus === 'completed') {
            await api.tasks.uncompleteSubtask(taskId, subtaskIndex)
          } else {
            await api.tasks.toggleSubtask(taskId, subtaskIndex)
          }
          queryClient.invalidateQueries({ queryKey: ['list-analytics'] })
        } catch {
          previousData.forEach(({ queryKey, data }) => {
            queryClient.setQueryData(queryKey as string[], data)
          })
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        }
      }, 400)

      timers.current.set(key, timer)
    },
    [queryClient],
  )

  return { mutate: toggle }
}

export function useCompleteTaskWithSubtasks() {
  const queryClient = useQueryClient()

  const mutate = useCallback(
    async (taskId: number) => {
      // See useToggleTask for why this matters: without canceling in-flight
      // refetches first, a stale response can land after our optimistic
      // write and overwrite it, causing a visible check/uncheck/check flicker.
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
              return {
                ...task,
                status: 'completed' as Task['status'],
                subtasks: (task.subtasks ?? []).map((s: Subtask) => ({ ...s, done: true })),
              }
            }),
          }
        })
      })

      try {
        await api.tasks.completeWithSubtasks(taskId)
        queryClient.invalidateQueries({ queryKey: ['list-analytics'] })
      } catch {
        previousData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey as string[], data)
        })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
    },
    [queryClient],
  )

  return { mutate, isPending: false }
}
