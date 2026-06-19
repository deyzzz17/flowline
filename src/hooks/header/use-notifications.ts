'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { listHabits } from '@/api/habits/actions'
import {
  listPendingRequests,
  listRecentlyAcceptedByOthers,
  acceptConnectionRequest,
  declineConnectionRequest,
  type PendingRequest,
  type AcceptedNotification,
} from '@/api/contacts/actions'
import type { Task } from '@/payload-types'
import type { HabitWithStats } from '@/api/habits/actions'

export type NotificationLevel =
  | 'today'
  | 'urgent'
  | 'warning'
  | 'goal_claim'
  | 'connection_request'
  | 'connection_accepted'

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
  connectionId?: number
  userImage?: string | null
}

const ACCEPTED_DISMISSED_KEY = 'connection_accepted_dismissed'

function getDismissedAcceptedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(ACCEPTED_DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function addDismissedAcceptedId(id: string) {
  if (typeof window === 'undefined') return
  try {
    const current = getDismissedAcceptedIds()
    current.add(id)
    localStorage.setItem(ACCEPTED_DISMISSED_KEY, JSON.stringify([...current]))
  } catch {}
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
    type ListObj = {
      id: number
      name: string
      slug: string
      category?: { color?: string | null } | null
    }
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

  const order: Record<NotificationLevel, number> = {
    connection_request: -1,
    connection_accepted: -1,
    today: 0,
    urgent: 1,
    warning: 2,
    goal_claim: 3,
  }
  return notifications.sort((a, b) => order[a.level] - order[b.level])
}

function buildGoalClaimNotifications(habits: HabitWithStats[]): TaskNotification[] {
  const notifications: TaskNotification[] = []
  for (const habit of habits) {
    const claimableIds = habit.claimableGoalIds ?? []
    if (claimableIds.length === 0) continue
    const goals = habit.goals ?? []
    for (const goalId of claimableIds) {
      const goal = goals.find((g) => g.id === goalId)
      if (!goal) continue
      notifications.push({
        id: `goal-claim-${habit.id}-${goalId}`,
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

function buildConnectionRequestNotifications(requests: PendingRequest[]): TaskNotification[] {
  return requests.map((r) => ({
    id: `connection-request-${r.connectionId}`,
    taskId: r.connectionId,
    taskTitle: r.user.name,
    listName: 'wants to connect with you',
    listSlug: '',
    listColor: '#8b5cf6',
    level: 'connection_request' as const,
    message: 'New connection request',
    dueDate: r.createdAt,
    connectionId: r.connectionId,
    userImage: r.user.image,
  }))
}

function buildConnectionAcceptedNotifications(
  accepted: AcceptedNotification[],
  dismissedIds: Set<string>,
): TaskNotification[] {
  return accepted
    .filter((a) => !dismissedIds.has(`connection-accepted-${a.connectionId}`))
    .map((a) => ({
      id: `connection-accepted-${a.connectionId}`,
      taskId: a.connectionId,
      taskTitle: a.user.name,
      listName: 'accepted your connection request',
      listSlug: '',
      listColor: '#10b981',
      level: 'connection_accepted' as const,
      message: 'Connection accepted',
      dueDate: a.respondedAt,
      connectionId: a.connectionId,
      userImage: a.user.image,
    }))
}

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const readIdsRef = useRef<Set<string>>(new Set())
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [dismissedAcceptedIds, setDismissedAcceptedIds] = useState<Set<string>>(new Set())
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    setDismissedAcceptedIds(getDismissedAcceptedIds())
  }, [])

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
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  })

  const { data: pendingRequestsData } = useQuery({
    queryKey: ['connections', 'pending-received'],
    queryFn: () => listPendingRequests(),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  const { data: acceptedByOthersData } = useQuery({
    queryKey: ['connections', 'recently-accepted-by-others'],
    queryFn: () => listRecentlyAcceptedByOthers(),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  const allNotifications = useMemo(() => {
    const taskNotifs = buildNotifications((data?.docs ?? []) as Task[])
    const goalNotifs = buildGoalClaimNotifications(habitsData ?? [])
    const requestNotifs = buildConnectionRequestNotifications(pendingRequestsData ?? [])
    const acceptedNotifs = buildConnectionAcceptedNotifications(
      acceptedByOthersData ?? [],
      dismissedAcceptedIds,
    )
    return [...requestNotifs, ...acceptedNotifs, ...taskNotifs, ...goalNotifs]
  }, [data, habitsData, pendingRequestsData, acceptedByOthersData, dismissedAcceptedIds])

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
    if (id.startsWith('connection-accepted-')) {
      addDismissedAcceptedId(id)
      setDismissedAcceptedIds((prev) => new Set([...prev, id]))
    }
  }

  const dismissAll = () => {
    const allIds = new Set(notifications.map((n) => n.id))
    setDismissedIds((prev) => new Set([...prev, ...allIds]))
    notifications.forEach((n) => {
      readIdsRef.current.add(n.id)
      if (n.id.startsWith('connection-accepted-')) addDismissedAcceptedId(n.id)
    })
    setDismissedAcceptedIds((prev) => {
      const next = new Set(prev)
      notifications.forEach((n) => {
        if (n.id.startsWith('connection-accepted-')) next.add(n.id)
      })
      return next
    })
    forceUpdate((c) => c + 1)
  }

  /**
   * Accepter/refuser directement depuis la cloche.
   * Optimistic update : la notif disparaît immédiatement de la liste ET
   * la page contacts (si ouverte ailleurs) reflète le changement instantanément,
   * sans attendre le prochain refetchInterval. Si le serveur échoue, tout revient
   * à l'état précédent (notif réapparaît, contact retiré).
   */
  const acceptMutation = useMutation({
    mutationFn: (connectionId: number) => acceptConnectionRequest(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: ['connections'] })
      await queryClient.cancelQueries({ queryKey: ['contacts'] })

      const previousPending = queryClient.getQueryData<PendingRequest[]>([
        'connections',
        'pending-received',
      ])
      const previousContactsPage = queryClient.getQueryData(['contacts', 'page-data'])

      const acceptedRequest = previousPending?.find((r) => r.connectionId === connectionId)

      // Retire immédiatement la demande de la liste des pending
      queryClient.setQueryData<PendingRequest[]>(
        ['connections', 'pending-received'],
        (old) => old?.filter((r) => r.connectionId !== connectionId) ?? [],
      )

      // Ajoute immédiatement le contact dans le cache de la page contacts, si chargé
      if (acceptedRequest) {
        queryClient.setQueriesData<any>({ queryKey: ['contacts', 'page-data'] }, (old: any) => {
          if (!old) return old
          return {
            ...old,
            pendingReceived: old.pendingReceived.filter(
              (r: PendingRequest) => r.connectionId !== connectionId,
            ),
            contacts: {
              ...old.contacts,
              docs: [
                ...old.contacts.docs,
                {
                  connectionId,
                  user: acceptedRequest.user,
                  connectedAt: new Date().toISOString(),
                },
              ].sort((a: any, b: any) => a.user.name.localeCompare(b.user.name)),
              total: old.contacts.total + 1,
            },
          }
        })
      }

      return { previousPending, previousContactsPage }
    },
    onError: (_err, _connectionId, context) => {
      // Rollback complet si le serveur a échoué
      if (context?.previousPending) {
        queryClient.setQueryData(['connections', 'pending-received'], context.previousPending)
      }
      if (context?.previousContactsPage) {
        queryClient.setQueriesData(
          { queryKey: ['contacts', 'page-data'] },
          context.previousContactsPage,
        )
      }
    },
    onSettled: () => {
      // Une fois la mutation terminée (succès ou échec), on resynchronise tout
      // d'un coup avec le serveur pour être certain que l'état final est exact.
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const declineMutation = useMutation({
    mutationFn: (connectionId: number) => declineConnectionRequest(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: ['connections'] })

      const previousPending = queryClient.getQueryData<PendingRequest[]>([
        'connections',
        'pending-received',
      ])

      queryClient.setQueryData<PendingRequest[]>(
        ['connections', 'pending-received'],
        (old) => old?.filter((r) => r.connectionId !== connectionId) ?? [],
      )

      queryClient.setQueriesData<any>({ queryKey: ['contacts', 'page-data'] }, (old: any) => {
        if (!old) return old
        return {
          ...old,
          pendingReceived: old.pendingReceived.filter(
            (r: PendingRequest) => r.connectionId !== connectionId,
          ),
        }
      })

      return { previousPending }
    },
    onError: (_err, _connectionId, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(['connections', 'pending-received'], context.previousPending)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  return {
    open,
    setOpen: handleOpen,
    notifications,
    hasUnread,
    count: notifications.length,
    dismiss,
    dismissAll,
    acceptConnection: acceptMutation.mutate,
    isAcceptingConnection: acceptMutation.isPending,
    declineConnection: declineMutation.mutate,
    isDecliningConnection: declineMutation.isPending,
  }
}
