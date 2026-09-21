import type { CollectionConfig } from 'payload'

// A group within a (non-Personal) workspace — Pro-only, unlimited once
// unlocked. See src/api/teams/actions.ts for access gating and
// src/collections/TeamMembers.ts / TeamRoles.ts for membership.
export const Teams: CollectionConfig = {
  slug: 'teams',
  admin: { useAsTitle: 'name' },
  fields: [
    {
      name: 'workspace',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Better Auth organization id this team belongs to.' },
    },
    { name: 'name', type: 'text', required: true },
    { name: 'createdBy', type: 'text', required: true, index: true },
    {
      name: 'planArchivedAt',
      type: 'date',
      required: false,
      index: true,
      admin: {
        description:
          'Set when the workspace owner drops below Pro — every team in the workspace is ' +
          'archived at once (no per-team choice, unlike lists). Restored automatically if the ' +
          'owner returns to Pro within 2 years; permanently deleted after that. Always hard-deleted ' +
          '(archived or not) when the workspace itself is deleted.',
      },
    },
  ],
  indexes: [{ fields: ['workspace', 'name'], unique: true }],
}
