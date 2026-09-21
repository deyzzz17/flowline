import type { CollectionConfig } from 'payload'

// A workspace-scoped, user-defined role layered on top of Better Auth's own
// owner/admin/member/viewer roles (which are code-defined and can't be
// extended dynamically). A custom role always maps to one of Better Auth's
// two invitable base tiers (admin or member/"Editor") for anything Better
// Auth itself enforces natively (invitations, member removal, role
// changes) — the three checkboxes here only refine the handful of
// permissions this app enforces on its own (see workspace-permissions.ts /
// getEffectiveWorkspacePermissions), on top of that base tier.
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
      name: 'baseTier',
      type: 'select',
      required: true,
      defaultValue: 'member',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'member' },
      ],
      admin: {
        description:
          'The underlying Better Auth role — governs invitations, member removal, and role changes, which Better Auth enforces itself and this app cannot override per-role.',
      },
    },
    {
      name: 'canModifyContent',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Create/edit lists, tasks, and calendar events — otherwise read-only.' },
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
