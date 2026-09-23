// Better Auth only understands "admin" or "member" for its own native
// endpoints (invitations, member removal/role changes, renaming the
// workspace) — a role needs that admin tier the moment it grants either of
// the two permissions that route through those endpoints. Every other
// checkbox is enforced by this app on top of whatever Better Auth allows.
export function deriveBetterAuthRole(input: {
  canManageMembers: boolean
  canManageWorkspaceSettings: boolean
}): 'admin' | 'member' {
  return input.canManageMembers || input.canManageWorkspaceSettings ? 'admin' : 'member'
}
