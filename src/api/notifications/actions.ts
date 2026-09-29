'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { getSession } from '@/lib/get-session'
import {
  listPendingRequests,
  listRecentlyAcceptedByOthers,
  type PendingRequest,
  type AcceptedNotification,
} from '@/api/contacts/actions'
import { listMyListInvites, type ListInvite } from '@/api/list-members/actions'
import {
  listMyCommentMentionNotifications,
  type CommentMentionNotification,
} from '@/api/task-comments/actions'
import {
  listMyTaskAssignmentNotifications,
  type TaskAssignmentNotification,
} from '@/api/tasks/actions'
import { listMyWorkspaceInvites, type WorkspaceInvite } from '@/api/workspaces/actions'
import { listMyEventInvitations, type EventInvitation } from '@/api/calendar/scheduler-actions'

export interface DueSoonTask {
  id: number
  title: string
  status: string
  dueDate: string
  list: { id: number; name: string; slug: string; category?: { color?: string | null } | null }
}

export interface NotificationFeed {
  dueSoonTasks: DueSoonTask[]
  pendingRequests: PendingRequest[]
  acceptedByOthers: AcceptedNotification[]
  listInvites: ListInvite[]
  commentMentions: CommentMentionNotification[]
  taskAssignments: TaskAssignmentNotification[]
  workspaceInvites: WorkspaceInvite[]
  eventInvitations: EventInvitation[]
}

const EMPTY_FEED: NotificationFeed = {
  dueSoonTasks: [],
  pendingRequests: [],
  acceptedByOthers: [],
  listInvites: [],
  commentMentions: [],
  taskAssignments: [],
  workspaceInvites: [],
  eventInvitations: [],
}

/**
 * Only the tasks the bell can actually show (active, due within the next
 * few days), with just the columns it renders. The bell used to reuse the
 * full `tasks.list()` — every task of the user, fully populated — on a 3s
 * poll, which was by far the biggest source of DB egress in the app. The
 * window is padded by a day on each side so the client's own local-time
 * "today/tomorrow/in 2 days" bucketing stays correct in any timezone.
 */
async function listDueSoonTasks(userId: string): Promise<DueSoonTask[]> {
  const payload = await getPayload({ config })
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const { docs } = await payload.find({
    collection: 'tasks',
    depth: 1,
    limit: 200,
    pagination: false,
    sort: 'dueDate',
    select: { title: true, status: true, dueDate: true, list: true },
    populate: { lists: { name: true, slug: true, category: true } },
    where: {
      and: [
        { userId: { equals: userId } },
        { status: { equals: 'active' } },
        { planArchivedAt: { exists: false } },
        { dueDate: { greater_than_equal: new Date(now - day).toISOString() } },
        { dueDate: { less_than: new Date(now + 4 * day).toISOString() } },
      ],
    },
  })
  return docs.filter(
    (t) => t.dueDate && t.list && typeof t.list === 'object',
  ) as unknown as DueSoonTask[]
}

/**
 * Everything the header's notification bell needs, in one server round trip
 * (one session lookup, all sources fetched in parallel) instead of the 8
 * separate server actions it used to poll independently every 3 seconds.
 */
export async function getNotificationFeed(): Promise<NotificationFeed> {
  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) return EMPTY_FEED

  const [
    dueSoonTasks,
    pendingRequests,
    acceptedByOthers,
    listInvites,
    commentMentions,
    taskAssignments,
    workspaceInvites,
    eventInvitations,
  ] = await Promise.all([
    listDueSoonTasks(userId).catch(() => []),
    listPendingRequests().catch(() => []),
    listRecentlyAcceptedByOthers().catch(() => []),
    listMyListInvites().catch(() => []),
    listMyCommentMentionNotifications().catch(() => []),
    listMyTaskAssignmentNotifications().catch(() => []),
    listMyWorkspaceInvites().catch(() => []),
    listMyEventInvitations().catch(() => []),
  ])

  return {
    dueSoonTasks,
    pendingRequests,
    acceptedByOthers,
    listInvites,
    commentMentions,
    taskAssignments,
    workspaceInvites,
    eventInvitations,
  }
}
