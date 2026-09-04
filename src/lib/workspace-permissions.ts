// Better Auth's org plugin ships 3 default roles: owner (auto-assigned to
// the creator, no restrictions at all), admin (can do everything except
// delete the workspace or touch the owner — enforced by Better Auth itself,
// see project memory), and the base "member" role, displayed as "Editor"
// everywhere in this app.
//
// `null` means Personal — Personal isn't a Better Auth organization, so
// there's no role and no restriction at all; every function here treats
// `null` the same as "unrestricted."
export type WorkspaceRole = 'owner' | 'admin' | 'member' | null

// Editors can create, edit, complete, and move tasks/subtasks to trash —
// just not permanently delete them. Only owner/admin (or Personal) can.
export function canPermanentlyDeleteTask(role: WorkspaceRole): boolean {
  return role !== 'member'
}

// Editors can create and edit calendar categories, just not delete them —
// deleting one also cascades to its events, which is admin/owner territory.
export function canDeleteCalendarCategory(role: WorkspaceRole): boolean {
  return role !== 'member'
}
