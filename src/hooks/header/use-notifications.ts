'use client'

import { useState, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { listHabits } from '@/api/habits/actions'
import type { Task } from '@/payload-types'
import type { HabitWithStats, HabitGoal } from '@/api/habits/actions'

export type NotificationLevel = 'today' | 'urgent' | 'warning' | 'goal_claim'

export interface TaskNotification {
  id: string
  taskId: number
  taskTitle: string
  listName: string
  listSlug: string
  listColor: string
  level: NotificationLevel
  message: string
  dueDate: string
  habitSlug?: string
  goalDescription?: string
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function buildNotifications(tasks: Task[]): TaskNotification[] {
  const now = new Date()
  const todayStart = startOfDay(now).getTime()
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000
  const twoDaysStart = todayStart + 2 * 24 * 60 * 60 * 1000
  const notifications: TaskNotification[] = []

  for (const task of tasks) {
    if (task.status !== 'active' || !task.dueDate) continue

    type ListObj = { id: number; name: string; slug: string; category?: { color?: string | null } | null }
    const list = task.list && typeof task.list === 'object' ? (task.list as ListObj) : null
    if (!list) continue

    const dueDate = new Date(task.dueDate)
    const dueDayStart = startOfDay(dueDate).getTime()

    if (isSameCalendarDay(dueDate, now)) {
      notifications.push({
        id: `today-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        listName: list.name,
        listSlug: list.slug,
        listColor: list.category?.color ?? '#8b5cf6',
        level: 'today',
        message: 'Due today',
        dueDate: task.dueDate,
      })
    } else if (dueDayStart === tomorrowStart) {
      notifications.push({
        id: `urgent-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        listName: list.name,
        listSlug: list.slug,
        listColor: list.category?.color ?? '#8b5cf6',
        level: 'urgent',
        message: 'Due tomorrow',
        dueDate: task.dueDate,
      })
    } else if (dueDayStart === twoDaysStart) {
      notifications.push({
        id: `warning-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        listName: list.name,
        listSlug: list.slug,
        listColor: list.category?.color ?? '#8b5cf6',
        level: 'warning',
        message: 'Due in 2 days',
        dueDate: task.dueDate,
      })
    }
  }

  const order: Record<NotificationLevel, number> = { today: 0, urgent: 1, warning: 2, goal_claim: 3 }
  return notifications.sort((a, b) => order[a.level] - order[b.level])
}

function buildGoalClaimNotifications(habits: HabitWithStats[]): TaskNotification[] {
  const notifications: TaskNotification[] = []

  for (const habit of habits) {
    const goals: HabitGoal[] = (() => {
      const raw = (habit as any).goals
      if (!raw) return []
      if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
      if (Array.isArray(raw)) return raw
      return []
    })()

    for (const goal of goals) {
      if (goal.completedAt) continue
      if (goal.type !== 'field' || !goal.endOnReach) continue

      const fieldTargets = goal.fieldTargets
        ?? (goal.fieldKey ? [{ fieldKey: goal.fieldKey, targetValue: goal.targetValue ?? 1 }] : [])
      if (fieldTargets.length === 0) continue
      
      if (habit.completionRate30d < 100) continue

      notifications.push({
        id: `goal-claim-${habit.id}-${goal.id}`,
        taskId: habit.id,
        taskTitle: habit.name,
        listName: goal.description,
        listSlug: habit.slug,
        listColor: habit.color,
        level: 'goal_claim',
        message: 'Goal ready to claim!',
        dueDate: new Date().toISOString(),
        habitSlug: habit.slug,
        goalDescription: goal.description,
      })
    }
  }

  return notifications
}

export const useNotifications = () => {
  const [open, setOpen] = useState(false)
  const readIdsRef = useRef<Set<string>>(new Set())
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [, forceUpdate] = useState(0)

  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  const { data: habitsData } = useQuery({
    queryKey: ['habits'],
    queryFn: () => listHabits(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 120_000,
  })

  const allNotifications = useMemo(() => {
    const taskNotifs = buildNotifications((data?.docs ?? []) as Task[])
    const goalNotifs = buildGoalClaimNotifications(habitsData ?? [])
    return [...taskNotifs, ...goalNotifs]
  }, [data, habitsData])

  const notifications = useMemo(
    () => allNotifications.filter((n) => !dismissedIds.has(n.id)),
    [allNotifications, dismissedIds],
  )

  const hasUnread = notifications.some((n) => !readIdsRef.current.has(n.id))

  const handleOpen = (value: boolean) => {
    setOpen(value)
    if (value) {
      notifications.forEach((n) => readIdsRef.current.add(n.id))
      forceUpdate((c) => c + 1)
    }
  }

  const dismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]))
    readIdsRef.current.add(id)
  }

  const dismissAll = () => {
    const allIds = new Set(notifications.map((n) => n.id))
    setDismissedIds((prev) => new Set([...prev, ...allIds]))
    notifications.forEach((n) => readIdsRef.current.add(n.id))
    forceUpdate((c) => c + 1)
  }

  return {
    open,
    setOpen: handleOpen,
    notifications,
    hasUnread,
    count: notifications.length,
    dismiss,
    dismissAll,
  }
}