// Better Auth's org plugin ships 3 default roles: owner (auto-assigned to
// the creator, no restrictions at all), admin (can do everything except
// delete the workspace or touch the owner — enforced by Better Auth itself,
// see project memory), and the base "member" role, displayed as "Editor"
// everywhere in this app. "viewer" is a custom 4th role, hard read-only:
// can view, toggle task completion, and like/dislike comments — nothing else.
//
// `null` means Personal — Personal isn't a Better Auth organization, so
// there's no role and no restriction at all; every function here treats
// `null` the same as "unrestricted."
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | null

// Editors can create, edit, complete, and move tasks/subtasks to trash —
// just not permanently delete them. Only owner/admin (or Personal) can.
export function canPermanentlyDeleteTask(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin' || role === null
}

// Editors can create and edit calendar categories, just not delete them —
// deleting one also cascades to its events, which is admin/owner territory.
export function canDeleteCalendarCategory(role: WorkspaceRole): boolean {
  return role === 'owner' || role === 'admin' || role === null
}

// Viewers can't create/edit/delete anything workspace-scoped — lists, tasks
// (outside toggling completion), calendar categories/events. Everyone else
// (owner/admin/member, or Personal) can.
export function canModifyWorkspaceContent(role: WorkspaceRole): boolean {
  return role !== 'viewer'
}
