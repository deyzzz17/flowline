'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'

export type NotificationLevel = 'warning' | 'urgent'

export interface TaskNotification {
  id: string
  taskId: number
  taskTitle: string
  listName: string
  listColor: string
  level: NotificationLevel
  message: string
  dueDate: string
}

function buildNotifications(tasks: Task[]): TaskNotification[] {
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  const twoDaysMs = 2 * oneDayMs
  const notifications: TaskNotification[] = []

  for (const task of tasks) {
    if (task.status !== 'active' || !task.dueDate) continue

    type ListObj = { id: number; name: string; category?: { color?: string | null } | null }
    const list = task.list && typeof task.list === 'object' ? (task.list as ListObj) : null
    if (!list) continue

    const listName = list.name
    const listColor = list.category?.color ?? '#8b5cf6'
    const diff = new Date(task.dueDate).getTime() - now

    if (diff > 0 && diff <= oneDayMs) {
      notifications.push({
        id: `urgent-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        listName,
        listColor,
        level: 'urgent',
        message: `Expires tomorrow`,
        dueDate: task.dueDate,
      })
    }
    else if (diff > oneDayMs && diff <= twoDaysMs) {
      notifications.push({
        id: `warning-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        listName,
        listColor,
        level: 'warning',
        message: `Expires in 2 days`,
        dueDate: task.dueDate,
      })
    }
  }

  return notifications.sort((a, b) => (a.level === 'urgent' && b.level !== 'urgent' ? -1 : 1))
}

export const useNotifications = () => {
  const [open, setOpen] = useState(false)
  const [hasBeenOpened, setHasBeenOpened] = useState(false)

  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    staleTime: 0,
  })

  const notifications = useMemo(() => buildNotifications((data?.docs ?? []) as Task[]), [data])

  const hasUnread = notifications.length > 0 && !hasBeenOpened

  const handleOpen = (value: boolean) => {
    setOpen(value)
    if (value && !hasBeenOpened) setHasBeenOpened(true)
  }

  return {
    open,
    setOpen: handleOpen,
    notifications,
    hasUnread,
    count: notifications.length,
  }
}
