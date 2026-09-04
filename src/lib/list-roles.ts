import type { BasePayload } from 'payload'
import { getWorkspaceRoleForUser } from './get-current-workspace'

export type ListRole = 'admin' | 'editor' | 'reader' | null

export async function resolveListRole(
  payload: BasePayload,
  listId: number,
  userId: string,
): Promise<ListRole> {
  const list = await payload.findByID({ collection: 'lists', id: listId }).catch((e) => {
    console.error('resolveListRole: failed to fetch list', listId, e)
    return null
  })
  // A plan-archived list is hidden throughout the app for everyone — admin
  // and members alike — until it's restored, so it must resolve to no role
  // rather than leaking access to whoever is still viewing/polling it.
  if (!list || list.planArchivedAt) return null

  const isOwner = list.userId === userId

  // Being granted access to the list at all still comes from ownership or an
  // accepted list-members row — that part is unchanged and identical for
  // Personal and workspace lists alike.
  if (!isOwner) {
    if (!list.isShared) return null
    const { totalDocs } = await payload.find({
      collection: 'list-members',
      where: {
        and: [
          { list: { equals: listId } },
          { userId: { equals: userId } },
          { status: { equals: 'accepted' } },
        ],
      },
      limit: 0,
    })
    if (totalDocs === 0) return null
  }

  if (!list.workspace) {
    if (isOwner) return 'admin'
    const { docs } = await payload.find({
      collection: 'list-members',
      where: {
        and: [
          { list: { equals: listId } },
          { userId: { equals: userId } },
          { status: { equals: 'accepted' } },
        ],
      },
      limit: 1,
    })
    const memberRole = docs[0]?.role
    return memberRole === 'editor' || memberRole === 'reader' ? memberRole : null
  }

  // Inside a workspace, the STRENGTH of the role (editor vs. reader, or a
  // hard cap for the owner too) is always derived live from the caller's
  // CURRENT workspace role, never from whatever was stored on the
  // list-members row at invite time — so it stays correct automatically as
  // workspace roles change later, instead of the stored value going stale.
  const workspaceRole = await getWorkspaceRoleForUser(list.workspace, userId)
  if (!workspaceRole) return null // no longer part of this workspace at all
  if (workspaceRole === 'viewer') return 'reader'
  return isOwner ? 'admin' : 'editor'
}

export async function resolveListRoleForTask(
  payload: BasePayload,
  taskId: number,
  userId: string,
): Promise<ListRole> {
  const task = await payload.findByID({ collection: 'tasks', id: taskId }).catch(() => null)
  if (!task || !task.list) return null
  const listId = typeof task.list === 'object' ? task.list.id : task.list
  return resolveListRole(payload, listId, userId)
}

export function canEditListContent(role: ListRole): boolean {
  return role === 'admin' || role === 'editor'
}

export function canViewList(role: ListRole): boolean {
  return role === 'admin' || role === 'editor' || role === 'reader'
}

// Everyone a task in this list could legitimately be assigned to: the admin
// (owner) plus every currently-accepted member. Used both to validate an
// assignment server-side and to resolve assignee profiles for display.
export async function getListMemberIds(payload: BasePayload, listId: number): Promise<string[]> {
  const list = await payload.findByID({ collection: 'lists', id: listId }).catch((e) => {
    console.error('getListMemberIds: failed to fetch list', listId, e)
    return null
  })
  if (!list) return []

  const { docs } = await payload.find({
    collection: 'list-members',
    where: {
      and: [{ list: { equals: listId } }, { status: { equals: 'accepted' } }],
    },
    limit: 0,
  })

  return [list.userId, ...docs.map((d) => d.userId as string)]
}
