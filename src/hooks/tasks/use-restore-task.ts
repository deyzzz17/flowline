'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function getRestoredStatus(task: Task): 'active' | 'inactive' {
  if (task.type !== 'recurring') return 'active'
  const recurrence = task.recurrence
  if (!recurrence) return 'active'
  if (recurrence.frequency === 'daily') return 'active'
  const today = DAYS[new Date().getDay()]
  const days = (recurrence.days ?? []) as string[]
  return days.includes(today) ? 'active' : 'inactive'
}

export const useRestoreTask = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.tasks.restore(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const queries = queryClient.getQueriesData<{ docs: Task[] }>({ queryKey: ['tasks'] })
      const previousData = queries.map(([queryKey, data]) => ({ queryKey, data }))

      let task: Task | undefined
      for (const [, data] of queries) {
        task = data?.docs.find((t) => t.id === id)
        if (task) break
      }

      if (!task) return { previousData }

      const newStatus = getRestoredStatus(task)
      const restoredTask = { ...task, status: newStatus as Task['status'] }

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<{ docs: Task[] }>(queryKey as string[], (old) => {
          if (!old) return old
          const withoutTask = old.docs.filter((t) => t.id !== id)
          const key = queryKey as string[]
          const isGeneralQuery = key.length === 1
          const isListQuery = key.length === 2 && typeof key[1] === 'number'
          const isTodayQuery = key[1] === 'today'
          const isRecurringQuery = key[1] === 'recurring'

          if (isGeneralQuery || isListQuery) {
            return { ...old, docs: [...withoutTask, restoredTask] }
          }
          if (isRecurringQuery && task!.type === 'recurring') {
            return { ...old, docs: [...withoutTask, restoredTask] }
          }
          if (isTodayQuery) {
            return { ...old, docs: withoutTask }
          }
          return { ...old, docs: withoutTask }
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
      const queries = queryClient.getQueriesData({ queryKey: ['tasks'] })
      queries.forEach(([queryKey]) => {
        const key = queryKey as string[]
        if (key[1] !== 'recurring') {
          queryClient.invalidateQueries({ queryKey: key })
        }
      })
    },
  })
}
