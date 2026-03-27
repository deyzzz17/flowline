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
      await queryClient.cancelQueries({ queryKey: ['tasks', 'inactive'] })

      const previous = queryClient.getQueryData(['tasks'])
      const previousInactive = queryClient.getQueryData(['tasks', 'inactive'])

      const allData = queryClient.getQueryData<{ docs: Task[] }>(['tasks'])
      const inactiveData = queryClient.getQueryData<{ docs: Task[] }>(['tasks', 'inactive'])
      const task =
        allData?.docs.find((t) => t.id === id) ?? inactiveData?.docs.find((t) => t.id === id)

      if (!task) return { previous, previousInactive }

      const newStatus = getRestoredStatus(task)

      queryClient.setQueryData<{ docs: Task[] }>(['tasks'], (old) => {
        if (!old) return old
        return {
          ...old,
          docs: old.docs.filter((t) => t.id !== id),
        }
      })

      if (newStatus === 'inactive') {
        queryClient.setQueryData<{ docs: Task[] }>(['tasks', 'inactive'], (old) => {
          if (!old) return { docs: [{ ...task, status: 'inactive' }] }
          return {
            ...old,
            docs: [{ ...task, status: 'inactive' }, ...old.docs],
          }
        })
      } else {
        queryClient.setQueryData<{ docs: Task[] }>(['tasks'], (old) => {
          if (!old) return { docs: [{ ...task, status: 'active' }] }
          return {
            ...old,
            docs: [{ ...task, status: 'active' }, ...old.docs],
          }
        })
      }

      return { previous, previousInactive }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['tasks'], context.previous)
      if (context?.previousInactive)
        queryClient.setQueryData(['tasks', 'inactive'], context.previousInactive)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'inactive'] })
    },
  })
}
