'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api'
import { WORKSPACE_SCOPED_QUERY_KEYS } from '@/components/dashboard/workspace-switcher'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'
import { listHabits } from '@/api/habits/actions'
import {
  listPendingRequests,
  listRecentlyAcceptedByOthers,
  acceptConnectionRequest,
  declineConnectionRequest,
  type PendingRequest,
  type AcceptedNotification,
} from '@/api/contacts/actions'
import {
  listMyListInvites,
  acceptListInvite,
  declineListInvite,
  type ListInvite,
} from '@/api/list-members/actions'
import {
  listMyCommentMentionNotifications,
  type CommentMentionNotification,
} from '@/api/task-comments/actions'
import {
  listMyTaskAssignmentNotifications,
  type TaskAssignmentNotification,
} from '@/api/tasks/actions'
import {
  listMyWorkspaceInvites,
  acceptWorkspaceInvite,
  declineWorkspaceInvite,
  type WorkspaceInvite,
} from '@/api/workspaces/actions'
import type { Task } from '@/payload-types'
import type { HabitWithStats } from '@/api/habits/actions'

export type NotificationLevel =
  | 'today'
  | 'urgent'
  | 'warning'
  | 'goal_claim'
  | 'connection_request'
  | 'connection_accepted'
  | 'list_invite'
  | 'comment_mention'
  | 'workspace_invite'
  | 'task_assignment'

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
  inviteId?: number
  workspaceInviteId?: string
}

// Persisted so state survives reload/reconnect — a notification, once
// dismissed or read, must not resurrect itself, and a toast must only ever
// fire once per notification id, for its entire lifetime.
const DISMISSED_KEY = 'notifications_dismissed_ids'
const READ_KEY = 'notifications_read_ids'
const TOASTED_KEY = 'notifications_toasted_ids'
const PENDING_RECEIVED_KEY = ['connections', 'pending-received']
const PAGE_DATA_KEY = ['contacts', 'page-data']
const LIST_INVITES_KEY = ['list-invites', 'mine']
const COMMENT_MENTIONS_KEY = ['task-comments', 'my-mentions']
const TASK_ASSIGNMENTS_KEY = ['tasks', 'my-assignments']
const WORKSPACE_INVITES_KEY = ['workspace-invites', 'mine']

function getIdSetFromStorage(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveIdSetToStorage(key: string, ids: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify([...ids]))
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
        id: `today-${task.id}-${task.dueDate}`,
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
        id: `urgent-${task.id}-${task.dueDate}`,
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
        id: `warning-${task.id}-${task.dueDate}`,
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
    list_invite: -1,
    workspace_invite: -1,
    comment_mention: -1,
    task_assignment: -1,
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

function buildListInviteNotifications(invites: ListInvite[]): TaskNotification[] {
  return invites.map((i) => ({
    id: `list-invite-${i.id}`,
    taskId: i.id,
    taskTitle: i.list.name,
    listName: i.invitedBy
      ? `${i.invitedBy.name} invited you to collaborate`
      : 'You were invited to collaborate',
    listSlug: i.list.slug,
    listColor: i.list.color ?? '#8b5cf6',
    level: 'list_invite' as const,
    message: 'List invite',
    dueDate: i.invitedAt,
    inviteId: i.id,
    userImage: i.invitedBy?.image ?? null,
  }))
}

function buildWorkspaceInviteNotifications(invites: WorkspaceInvite[]): TaskNotification[] {
  return invites.map((i) => ({
    id: `workspace-invite-${i.id}`,
    taskId: 0,
    taskTitle: i.organizationName,
    listName: i.inviterName
      ? `${i.inviterName} invited you to join as ${i.role === 'admin' ? 'Admin' : 'Editor'}`
      : `You were invited to join as ${i.role === 'admin' ? 'Admin' : 'Editor'}`,
    listSlug: '',
    listColor: '#8b5cf6',
    level: 'workspace_invite' as const,
    message: 'Workspace invite',
    dueDate: i.createdAt,
    workspaceInviteId: i.id,
  }))
}

function buildConnectionAcceptedNotifications(
  accepted: AcceptedNotification[],
): TaskNotification[] {
  return accepted.map((a) => ({
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

function buildCommentMentionNotifications(
  mentions: CommentMentionNotification[],
): TaskNotification[] {
  return mentions.map((m) => ({
    id: `comment-mention-${m.commentId}`,
    taskId: m.taskId,
    taskTitle: m.taskTitle,
    listName: `${m.authorName} mentioned you in a comment`,
    listSlug: m.listSlug,
    listColor: m.listColor,
    level: 'comment_mention' as const,
    message: 'Mentioned in a comment',
    dueDate: m.createdAt,
    userImage: m.authorImage,
  }))
}

function buildTaskAssignmentNotifications(
  assignments: TaskAssignmentNotification[],
): TaskNotification[] {
  return assignments.map((a) => ({
    id: `task-assignment-${a.taskId}`,
    taskId: a.taskId,
    taskTitle: a.taskTitle,
    listName: `Assigned to you on "${a.listName}"`,
    listSlug: a.listSlug,
    listColor: a.listColor,
    level: 'task_assignment' as const,
    message: 'New task assignment',
    dueDate: new Date().toISOString(),
  }))
}

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // All three sets are persisted to localStorage and hydrated lazily on
  // mount, so dismissed/read/already-toasted state survives reload and
  // reconnecting — a dismissed notification must never come back, the
  // unread dot must stay cleared until something genuinely new arrives,
  // and a toast must fire at most once per notification id, ever.
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() =>
    getIdSetFromStorage(DISMISSED_KEY),
  )
  const [readIds, setReadIds] = useState<Set<string>>(() => getIdSetFromStorage(READ_KEY))
  const [toastedIds, setToastedIds] = useState<Set<string>>(() =>
    getIdSetFromStorage(TOASTED_KEY),
  )
  const toastedIdsRef = useRef(toastedIds)
  toastedIdsRef.current = toastedIds
  const seenIdsRef = useRef<Set<string> | null>(null)

  // All notification sources poll on the same short cadence used elsewhere
  // in the app for shared/collaborative data (see realtime.ts) — this is
  // what makes a new invite, mention, or assignment show up live in the
  // bell without the user ever needing to reload the page.
  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const { data: habitsData } = useQuery({
    queryKey: ['habits'],
    queryFn: () => listHabits(),
    staleTime: SHARED_LIST_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const { data: pendingRequestsData } = useQuery({
    queryKey: PENDING_RECEIVED_KEY,
    queryFn: () => listPendingRequests(),
    staleTime: SHARED_LIST_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const { data: acceptedByOthersData } = useQuery({
    queryKey: ['connections', 'recently-accepted-by-others'],
    queryFn: () => listRecentlyAcceptedByOthers(),
    staleTime: SHARED_LIST_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const { data: listInvitesData } = useQuery({
    queryKey: LIST_INVITES_KEY,
    queryFn: () => listMyListInvites(),
    staleTime: SHARED_LIST_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const { data: commentMentionsData } = useQuery({
    queryKey: COMMENT_MENTIONS_KEY,
    queryFn: () => listMyCommentMentionNotifications(),
    staleTime: SHARED_LIST_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const { data: taskAssignmentsData } = useQuery({
    queryKey: TASK_ASSIGNMENTS_KEY,
    queryFn: () => listMyTaskAssignmentNotifications(),
    staleTime: SHARED_LIST_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const { data: workspaceInvitesData } = useQuery({
    queryKey: WORKSPACE_INVITES_KEY,
    queryFn: () => listMyWorkspaceInvites(),
    staleTime: SHARED_LIST_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const allNotifications = useMemo(() => {
    const taskNotifs = buildNotifications((data?.docs ?? []) as Task[])
    const goalNotifs = buildGoalClaimNotifications(habitsData ?? [])
    const requestNotifs = buildConnectionRequestNotifications(pendingRequestsData ?? [])
    const acceptedNotifs = buildConnectionAcceptedNotifications(acceptedByOthersData ?? [])
    const listInviteNotifs = buildListInviteNotifications(listInvitesData ?? [])
    const commentMentionNotifs = buildCommentMentionNotifications(commentMentionsData ?? [])
    const taskAssignmentNotifs = buildTaskAssignmentNotifications(taskAssignmentsData ?? [])
    const workspaceInviteNotifs = buildWorkspaceInviteNotifications(workspaceInvitesData ?? [])
    return [
      ...requestNotifs,
      ...listInviteNotifs,
      ...workspaceInviteNotifs,
      ...acceptedNotifs,
      ...commentMentionNotifs,
      ...taskAssignmentNotifs,
      ...taskNotifs,
      ...goalNotifs,
    ]
  }, [
    data,
    habitsData,
    pendingRequestsData,
    acceptedByOthersData,
    listInvitesData,
    commentMentionsData,
    taskAssignmentsData,
    workspaceInvitesData,
  ])

  const notifications = useMemo(
    () => allNotifications.filter((n) => !dismissedIds.has(n.id)),
    [allNotifications, dismissedIds],
  )

  // Fire a one-time toast for notifications that genuinely just appeared.
  // The first run only establishes a baseline (so reload/reconnect never
  // replays a toast for something already sitting in the list); every id,
  // once toasted, is persisted and will never toast again.
  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id))

    if (seenIdsRef.current === null) {
      seenIdsRef.current = currentIds
      const missing = [...currentIds].filter((id) => !toastedIdsRef.current.has(id))
      if (missing.length > 0) {
        const next = new Set(toastedIdsRef.current)
        missing.forEach((id) => next.add(id))
        saveIdSetToStorage(TOASTED_KEY, next)
        setToastedIds(next)
      }
      return
    }

    const newOnes = notifications.filter(
      (n) => !seenIdsRef.current!.has(n.id) && !toastedIdsRef.current.has(n.id),
    )
    seenIdsRef.current = currentIds
    if (newOnes.length === 0) return

    const next = new Set(toastedIdsRef.current)
    newOnes.forEach((n) => {
      next.add(n.id)
      toast.message(n.taskTitle, {
        description: n.message,
        duration: 2000,
        position: 'top-right',
      })
    })
    saveIdSetToStorage(TOASTED_KEY, next)
    setToastedIds(next)
  }, [notifications])

  const hasUnread = notifications.some((n) => !readIds.has(n.id))

  const handleOpen = (value: boolean) => {
    setOpen(value)
    if (value && notifications.length > 0) {
      setReadIds((prev) => {
        let changed = false
        const next = new Set(prev)
        notifications.forEach((n) => {
          if (!next.has(n.id)) {
            next.add(n.id)
            changed = true
          }
        })
        if (!changed) return prev
        saveIdSetToStorage(READ_KEY, next)
        return next
      })
    }
  }

  const dismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      saveIdSetToStorage(DISMISSED_KEY, next)
      return next
    })
    setReadIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveIdSetToStorage(READ_KEY, next)
      return next
    })
  }

  const dismissAll = () => {
    const allIds = notifications.map((n) => n.id)
    setDismissedIds((prev) => {
      const next = new Set(prev)
      allIds.forEach((id) => next.add(id))
      saveIdSetToStorage(DISMISSED_KEY, next)
      return next
    })
    setReadIds((prev) => {
      const next = new Set(prev)
      allIds.forEach((id) => next.add(id))
      saveIdSetToStorage(READ_KEY, next)
      return next
    })
  }

  const acceptMutation = useMutation({
    mutationFn: (connectionId: number) => acceptConnectionRequest(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: PENDING_RECEIVED_KEY })
      await queryClient.cancelQueries({ queryKey: PAGE_DATA_KEY })

      const previousPending = queryClient.getQueryData<PendingRequest[]>(PENDING_RECEIVED_KEY)
      const previousPageData = queryClient.getQueryData(PAGE_DATA_KEY)

      const acceptedRequest = previousPending?.find((r) => r.connectionId === connectionId)

      queryClient.setQueryData<PendingRequest[]>(
        PENDING_RECEIVED_KEY,
        (old) => old?.filter((r) => r.connectionId !== connectionId) ?? [],
      )

      if (acceptedRequest) {
        queryClient.setQueriesData<any>({ queryKey: PAGE_DATA_KEY }, (old: any) => {
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

      return { previousPending, previousPageData }
    },
    onError: (_err, _connectionId, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(PENDING_RECEIVED_KEY, context.previousPending)
      }
      if (context?.previousPageData) {
        queryClient.setQueriesData({ queryKey: PAGE_DATA_KEY }, context.previousPageData)
      }
    },
  })

  const declineMutation = useMutation({
    mutationFn: (connectionId: number) => declineConnectionRequest(connectionId),
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: PENDING_RECEIVED_KEY })
      await queryClient.cancelQueries({ queryKey: PAGE_DATA_KEY })

      const previousPending = queryClient.getQueryData<PendingRequest[]>(PENDING_RECEIVED_KEY)

      queryClient.setQueryData<PendingRequest[]>(
        PENDING_RECEIVED_KEY,
        (old) => old?.filter((r) => r.connectionId !== connectionId) ?? [],
      )

      queryClient.setQueriesData<any>({ queryKey: PAGE_DATA_KEY }, (old: any) => {
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
        queryClient.setQueryData(PENDING_RECEIVED_KEY, context.previousPending)
      }
    },
  })

  const acceptListInviteMutation = useMutation({
    mutationFn: (inviteId: number) => acceptListInvite(inviteId),
    onMutate: async (inviteId) => {
      await queryClient.cancelQueries({ queryKey: LIST_INVITES_KEY })
      const previousInvites = queryClient.getQueryData<ListInvite[]>(LIST_INVITES_KEY)
      queryClient.setQueryData<ListInvite[]>(
        LIST_INVITES_KEY,
        (old) => old?.filter((i) => i.id !== inviteId) ?? [],
      )
      return { previousInvites }
    },
    onError: (_err, _inviteId, context) => {
      if (context?.previousInvites) {
        queryClient.setQueryData(LIST_INVITES_KEY, context.previousInvites)
      }
    },
    onSuccess: (result) => {
      if (!result.ok) return
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['lists', 'shared-with-me'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const declineListInviteMutation = useMutation({
    mutationFn: (inviteId: number) => declineListInvite(inviteId),
    onMutate: async (inviteId) => {
      await queryClient.cancelQueries({ queryKey: LIST_INVITES_KEY })
      const previousInvites = queryClient.getQueryData<ListInvite[]>(LIST_INVITES_KEY)
      queryClient.setQueryData<ListInvite[]>(
        LIST_INVITES_KEY,
        (old) => old?.filter((i) => i.id !== inviteId) ?? [],
      )
      return { previousInvites }
    },
    onError: (_err, _inviteId, context) => {
      if (context?.previousInvites) {
        queryClient.setQueryData(LIST_INVITES_KEY, context.previousInvites)
      }
    },
  })

  const acceptWorkspaceInviteMutation = useMutation({
    mutationFn: (invitationId: string) => acceptWorkspaceInvite(invitationId),
    onMutate: async (invitationId) => {
      await queryClient.cancelQueries({ queryKey: WORKSPACE_INVITES_KEY })
      const previousInvites = queryClient.getQueryData<WorkspaceInvite[]>(WORKSPACE_INVITES_KEY)
      queryClient.setQueryData<WorkspaceInvite[]>(
        WORKSPACE_INVITES_KEY,
        (old) => old?.filter((i) => i.id !== invitationId) ?? [],
      )
      return { previousInvites }
    },
    onError: (_err, _invitationId, context) => {
      if (context?.previousInvites) {
        queryClient.setQueryData(WORKSPACE_INVITES_KEY, context.previousInvites)
      }
    },
    onSuccess: (result) => {
      if (!result.ok) return
      // Accepting sets the new organization as the active workspace
      // server-side — mirror what the switcher itself does on a manual
      // switch, or you'd stay wherever you were with stale data on screen.
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      for (const key of WORKSPACE_SCOPED_QUERY_KEYS) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
      setOpen(false)
      router.push('/lists/today')
    },
  })

  const declineWorkspaceInviteMutation = useMutation({
    mutationFn: (invitationId: string) => declineWorkspaceInvite(invitationId),
    onMutate: async (invitationId) => {
      await queryClient.cancelQueries({ queryKey: WORKSPACE_INVITES_KEY })
      const previousInvites = queryClient.getQueryData<WorkspaceInvite[]>(WORKSPACE_INVITES_KEY)
      queryClient.setQueryData<WorkspaceInvite[]>(
        WORKSPACE_INVITES_KEY,
        (old) => old?.filter((i) => i.id !== invitationId) ?? [],
      )
      return { previousInvites }
    },
    onError: (_err, _invitationId, context) => {
      if (context?.previousInvites) {
        queryClient.setQueryData(WORKSPACE_INVITES_KEY, context.previousInvites)
      }
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
    acceptListInvite: acceptListInviteMutation.mutate,
    isAcceptingListInvite: acceptListInviteMutation.isPending,
    declineListInvite: declineListInviteMutation.mutate,
    isDecliningListInvite: declineListInviteMutation.isPending,
    acceptWorkspaceInvite: acceptWorkspaceInviteMutation.mutate,
    isAcceptingWorkspaceInvite: acceptWorkspaceInviteMutation.isPending,
    declineWorkspaceInvite: declineWorkspaceInviteMutation.mutate,
    isDecliningWorkspaceInvite: declineWorkspaceInviteMutation.isPending,
  }
}
