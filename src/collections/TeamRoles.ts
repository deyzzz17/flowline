import type { CollectionConfig } from 'payload'

// A role that only exists — and is only assignable — within one specific
// team, created either while setting up the team or later from its Members
// tab. Unlike the workspace-level custom-roles collection (which is
// bottlenecked by what Better Auth itself enforces), team permissions are
// fully our own — these 3 checkboxes gate the team's own action surface
// (its Lists tab, Calendar tab, and Members tab) directly.
export const TeamRoles: CollectionConfig = {
  slug: 'team-roles',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'team', type: 'relationship', relationTo: 'teams', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    {
      name: 'canManageLists',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Create lists in this team.' },
    },
    {
      name: 'canManageCalendar',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Create calendar categories in this team.' },
    },
    {
      name: 'canManageMembers',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Add/remove team members, change their role, and create/delete team roles.',
      },
    },
  ],
  indexes: [{ fields: ['team', 'name'], unique: true }],
}
