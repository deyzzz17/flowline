import type { CollectionConfig } from 'payload'

// A role that only exists — and is only assignable — within one specific
// team, created either while setting up the team or later from its Members
// tab. Distinct from the workspace-level custom-roles collection: team
// roles are a plain label for now (no permission checkboxes), since no
// team-scoped action in the app checks one yet.
export const TeamRoles: CollectionConfig = {
  slug: 'team-roles',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'team', type: 'relationship', relationTo: 'teams', required: true, index: true },
    { name: 'name', type: 'text', required: true },
  ],
  indexes: [{ fields: ['team', 'name'], unique: true }],
}
