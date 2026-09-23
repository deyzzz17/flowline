import type { CollectionConfig } from 'payload'

// A workspace-scoped, user-defined role layered on top of Better Auth's own
// owner/admin/member/viewer roles (which are code-defined and can't be
// extended dynamically). There's no separate "base tier" picker anymore —
// Better Auth only needs to know "admin" or "member" for its own native
// endpoints (invitations, member removal/role changes, renaming the
// workspace), and that's derived automatically: a role counts as
// Better-Auth-admin the moment canManageMembers or
// canManageWorkspaceSettings is checked (see
// updateWorkspaceMemberRole/inviteWorkspaceMember). Every checkbox below is
// still independently enforced by this app on top of that, so e.g. a role
// can be Better-Auth-admin (to pass invite/remove) while still being denied
// canManageLists by us.
export const CustomRoles: CollectionConfig = {
  slug: 'custom-roles',
  admin: {
    useAsTitle: 'name',
    description: 'Custom workspace roles: a name plus which of this app\'s own permissions they grant.',
  },
  fields: [
    {
      name: 'workspace',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Better Auth organization id this role belongs to.' },
    },
    { name: 'name', type: 'text', required: true },
    {
      name: 'canManageWorkspaceSettings',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Rename the workspace, change its icon/color.' },
    },
    {
      name: 'canManageMembers',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Invite/remove workspace members and change their role.' },
    },
    {
      name: 'canManageLists',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Create lists directly in the workspace (outside of any team).' },
    },
    {
      name: 'canManageCalendar',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Create calendar events/categories directly in the workspace (outside of any team).',
      },
    },
    {
      name: 'canManageTeams',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Create teams in this workspace.' },
    },
    {
      name: 'canPermanentlyDeleteTasks',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Permanently delete tasks from the trash.' },
    },
    {
      name: 'canDeleteCalendarCategories',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Delete calendar categories (and their events).' },
    },
  ],
  indexes: [{ fields: ['workspace', 'name'], unique: true }],
}
