import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  PayloadRequest,
} from 'payload'
import {
  publishInvalidation,
  getRealtimeActor,
  isRealtimeConfigured,
} from '../../lib/realtime-server'
import { realtimeChannels } from '../../lib/realtime'
import { invalidateWorkspace, invalidateUserData, type UserDataScope } from '../../lib/server-cache'

// Collection hooks that push a content-free "these query keys changed" hint
// to the clients concerned (see src/lib/realtime.ts) whenever a document
// changes — so other members see it right away without any client polling
// the DB. Centralised here rather than in each server action so no mutation
// path (actions, Inngest jobs, the admin panel) can forget to notify.

type Keys = readonly (readonly unknown[])[]
type Doc = Record<string, unknown>
type Route = { channels: (string | null | undefined | false)[]; keys: Keys }
type Router = (doc: Doc, req: PayloadRequest) => Route | Route[] | Promise<Route | Route[]>

const idOf = (value: unknown): string | number | null => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'object') return (value as { id?: string | number }).id ?? null
  return value as string | number
}

const ws = (doc: Doc) => {
  const id = idOf(doc.workspace)
  return id ? realtimeChannels.workspace(String(id)) : null
}
const list = (doc: Doc, field = 'list') => {
  const id = idOf(doc[field])
  return id ? realtimeChannels.list(id) : null
}
const users = (ids: unknown) =>
  (Array.isArray(ids) ? ids : ids ? [ids] : []).map((id) => realtimeChannels.user(String(id)))

function publish(route: Route | Route[], actor: string | null) {
  for (const r of Array.isArray(route) ? route : [route]) {
    publishInvalidation(r.channels, r.keys, actor)
  }
}

/**
 * Adds afterChange/afterDelete hooks that publish what `router` returns (for
 * both the new and previous doc), and run `onWrite` (server-cache
 * invalidation — see src/lib/server-cache.ts) whether or not push is set up.
 */
export function withRealtime(
  config: CollectionConfig,
  router: Router,
  onWrite?: (doc: Doc) => void,
): CollectionConfig {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    onWrite?.(doc)
    if (!isRealtimeConfigured()) return doc
    try {
      const actor = await getRealtimeActor()
      publish(await router(doc, req), actor)
      if (previousDoc && Object.keys(previousDoc).length > 0) {
        publish(await router(previousDoc, req), actor)
      }
    } catch (e) {
      console.error(`[realtime] ${config.slug} afterChange`, e)
    }
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    onWrite?.(doc)
    if (!isRealtimeConfigured()) return doc
    try {
      publish(await router(doc, req), await getRealtimeActor())
    } catch (e) {
      console.error(`[realtime] ${config.slug} afterDelete`, e)
    }
    return doc
  }
  return {
    ...config,
    hooks: {
      ...config.hooks,
      afterChange: [...(config.hooks?.afterChange ?? []), afterChange],
      afterDelete: [...(config.hooks?.afterDelete ?? []), afterDelete],
    },
  }
}

export const taskRoute: Router = (doc) => {
  const listId = idOf(doc.list)
  return [
    {
      channels: [list(doc), ws(doc)],
      keys: [
        ...(listId ? [['tasks', listId]] : []),
        ...(doc.workspace ? [['tasks', 'workspace-calendar']] : []),
      ],
    },
    // Assignment/due-date notifications live in the bell.
    { channels: users(doc.assignedTo), keys: [['notifications']] },
  ]
}

export const listRoute: Router = (doc) => ({
  channels: [list(doc, 'id'), ws(doc)],
  keys: [['lists']],
})

export const listMemberRoute: Router = (doc) => {
  const listId = idOf(doc.list)
  const keys: Keys = [['list-members', listId], ['lists'], ['notifications'], ['list-invites']]
  return { channels: [list(doc), ...users(doc.userId)], keys }
}

export const taskCommentRoute: Router = async (doc, req) => {
  const taskId = idOf(doc.task)
  if (!taskId) return []
  const task = await req.payload
    .findByID({
      collection: 'tasks',
      id: taskId,
      depth: 0,
      select: { list: true, workspace: true },
      req,
    })
    .catch(() => null)
  return [
    {
      channels: task ? [list(task as Doc), ws(task as Doc)] : [],
      keys: [['task-comments', taskId]],
    },
    { channels: users(doc.mentions), keys: [['notifications']] },
  ]
}

export const teamRoute: Router = (doc) => ({
  channels: [ws(doc)],
  keys: [['teams'], ['lists']],
})

// team-members / team-roles only point at their team; the team's workspace
// is one lookup away.
export const teamChildRoute: Router = async (doc, req) => {
  const teamId = idOf(doc.team)
  if (!teamId) return []
  const team = await req.payload
    .findByID({ collection: 'teams', id: teamId, depth: 0, select: { workspace: true }, req })
    .catch(() => null)
  return {
    channels: [team ? ws(team as Doc) : null, ...users(doc.userId)],
    keys: [['teams'], ['lists']],
  }
}

export const customRoleRoute: Router = (doc) => ({
  channels: [ws(doc)],
  keys: [['custom-roles'], ['workspace-members'], ['workspaces'], ['lists'], ['teams']],
})

export const calendarEventRoute: Router = (doc) => ({
  channels: [ws(doc)],
  keys: [['workspace-calendar-events']],
})

export const calendarCategoryRoute: Router = (doc) => ({
  channels: [ws(doc)],
  keys: [['calendar-categories'], ['workspace-calendar-events']],
})

export const connectionRoute: Router = (doc) => ({
  channels: users([doc.requesterId, doc.recipientId]),
  keys: [['notifications'], ['connections'], ['contacts']],
})

/** Invalidates the workspace's cached membership/permissions (see get-current-workspace.ts). */
export const invalidateWorkspaceOf =
  (field: string) =>
  (doc: Doc): void => {
    const id = idOf(doc[field])
    if (id) invalidateWorkspace(String(id))
  }

// A workspace (or one member) being archived/restored by a plan change
// changes what every member can see in it.
export const workspaceArchiveRoute: Router = (doc) => ({
  channels: [
    doc.organizationId ? realtimeChannels.workspace(String(doc.organizationId)) : null,
    ...users(doc.userId ?? doc.ownerId),
  ],
  keys: [['workspaces'], ['workspace-members'], ['lists'], ['teams']],
})

/** Invalidates the owner's cached dashboard/analytics data of this kind (see server-cache.ts). */
export const invalidateUserDataOf =
  (scope: UserDataScope) =>
  (doc: Doc): void => {
    if (doc.userId) invalidateUserData(String(doc.userId), scope)
  }

/** Only the cache invalidation part of withRealtime, for collections nobody else watches live. */
export function withCacheInvalidation(
  config: CollectionConfig,
  onWrite: (doc: Doc) => void,
): CollectionConfig {
  return withRealtime(config, () => [], onWrite)
}

/** Runs several onWrite callbacks. */
export const all =
  (...fns: ((doc: Doc) => void)[]) =>
  (doc: Doc): void => {
    for (const fn of fns) fn(doc)
  }

/** Invalidates the cached plan-compliance checks of the user in `field` (see the check*Compliance actions). */
export const invalidateComplianceOf =
  (field: string) =>
  (doc: Doc): void => {
    if (doc[field]) invalidateUserData(String(doc[field]), 'compliance')
  }
