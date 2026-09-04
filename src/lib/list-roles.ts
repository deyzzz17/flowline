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

  if (list.workspace) {
    const workspaceRole = await getWorkspaceRoleForUser(list.workspace, userId)
    if (!workspaceRole) return null // not part of this workspace at all

    // The workspace's own owner/admin can fully manage EVERY list inside
    // it — view, edit, delete, manage members — regardless of who created
    // the list or whether they were personally added to it. This is what
    // "owner peut tout faire" / "admin peut tout faire sauf supprimer le
    // workspace ou toucher les membres" (phase 16) actually implies for
    // lists specifically, and it was NOT previously true: only the list's
    // own creator ever got 'admin' before, so a workspace owner/admin
    // couldn't even delete a list they didn't personally create.
    if (workspaceRole === 'owner' || workspaceRole === 'admin') return 'admin'

    // Editor/Viewer stay membership-gated exactly like before — they only
    // ever get a role on their own list or one they were specifically
    // added to (see phase 13/18: this is deliberate, not a bug).
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

    // A workspace Viewer is a hard read-only ceiling, even on a list they
    // own outright.
    return workspaceRole === 'viewer' ? 'reader' : isOwner ? 'admin' : 'editor'
  }

  // Personal: no workspace-role concept — role comes purely from ownership
  // or the role stored on the list-member row.
  if (isOwner) return 'admin'
  if (!list.isShared) return null
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
