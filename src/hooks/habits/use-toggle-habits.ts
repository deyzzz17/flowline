'use client'

import { useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toggleHabitCompletion } from '@/api/habits/actions'
import type { HabitWithStats } from '@/api/habits/actions'

export function useToggleHabit() {
  const queryClient = useQueryClient()

  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const pendingStates = useRef<Map<number, { completedToday: boolean; timezone: string }>>(
    new Map(),
  )

  const toggle = useCallback(
    ({
      habit,
      timezone,
    }: {
      habit: HabitWithStats
      timezone: string
    }) => {
      const habitId = habit.id
      const newCompleted = !habit.completedToday

      queryClient.setQueryData<HabitWithStats[]>(['habits'], (old) => {
        if (!old) return old
        return old.map((h) =>
          h.id === habitId
            ? {
                ...h,
                completedToday: newCompleted,
                currentStreak: newCompleted
                  ? h.currentStreak + 1
                  : Math.max(0, h.currentStreak - 1),
              }
            : h,
        )
      })

      pendingStates.current.set(habitId, { completedToday: newCompleted, timezone })

      const existing = timers.current.get(habitId)
      if (existing) clearTimeout(existing)

      const snapshot = queryClient.getQueryData<HabitWithStats[]>(['habits'])

      const timer = setTimeout(async () => {
        timers.current.delete(habitId)
        const target = pendingStates.current.get(habitId)
        pendingStates.current.delete(habitId)
        if (!target) return

        try {
          await toggleHabitCompletion(habitId, undefined, undefined, target.timezone)
          queryClient.invalidateQueries({ queryKey: ['habits'] })
        } catch {
          if (snapshot) {
            queryClient.setQueryData(['habits'], snapshot)
          }
          queryClient.invalidateQueries({ queryKey: ['habits'] })
        }
      }, 400)

      timers.current.set(habitId, timer)
    },
    [queryClient],
  )

  return { toggle }
}