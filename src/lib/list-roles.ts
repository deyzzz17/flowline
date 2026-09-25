import type { BasePayload } from 'payload'
import { getWorkspaceRoleForUser, getEffectiveWorkspacePermissions } from './get-current-workspace'

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

    // A team-scoped list is visible to the team's own members via their
    // team role, entirely separate from the isShared/list-members path
    // below (which team lists never use). The list's own creator and the
    // team's creator always get full control. An explicit team-member role
    // assignment comes next and always wins from there — even over someone
    // who is otherwise the workspace's owner/admin, same precedence as
    // getTeamPermissionsForUser, so a deliberately restricted team role
    // actually restricts them on that team's lists too. Only someone with
    // no assignment on this team at all falls back to the workspace-wide
    // owner/admin override (a custom role's derived 'admin' tier doesn't
    // count there — see deriveBetterAuthRole).
    if (list.team) {
      if (isOwner) return 'admin'
      const teamId = typeof list.team === 'object' ? list.team.id : list.team

      const team = await payload.findByID({ collection: 'teams', id: teamId }).catch(() => null)
      if (team?.createdBy === userId) return 'admin'

      const { docs: memberDocs } = await payload.find({
        collection: 'team-members',
        where: { and: [{ team: { equals: teamId } }, { userId: { equals: userId } }] },
        limit: 1,
        depth: 1,
      })
      const member = memberDocs[0]
      const role = member && typeof member.teamRole === 'object' ? member.teamRole : null
      if (role) {
        return workspaceRole === 'viewer' ? 'reader' : role.canManageLists ? 'editor' : 'reader'
      }

      const effective = await getEffectiveWorkspacePermissions(list.workspace, userId)
      const isPlainOwnerOrAdmin =
        (effective.role === 'owner' || effective.role === 'admin') &&
        effective.customRoleName === null
      return isPlainOwnerOrAdmin ? 'admin' : null
    }

    // A list that was never shared is private to whoever created it —
    // that stays true even for the workspace's own owner/admin. Only once
    // a list has had at least one member added (isShared) does it become
    // something the owner/admin can see and fully manage on top of the
    // creator themselves.
    if (!isOwner && !list.isShared) return null

    // The workspace's own owner/admin can fully manage every SHARED list
    // inside it — view, edit, delete, manage members — regardless of who
    // created it or whether they were personally added to it. This is what
    // "owner peut tout faire" / "admin peut tout faire sauf supprimer le
    // workspace ou toucher les membres" (phase 16) implies for lists, but
    // it stops at the workspace's private, not-yet-shared lists — those
    // remain visible only to their creator, exactly like Personal lists.
    if (workspaceRole === 'owner' || workspaceRole === 'admin') return 'admin'

    // Editor/Viewer stay membership-gated exactly like before — they only
    // ever get a role on their own list or one they were specifically
    // added to (see phase 13/18: this is deliberate, not a bug). We already
    // know the list is shared at this point (private lists returned above).
    if (!isOwner) {
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
