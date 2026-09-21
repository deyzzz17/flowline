import type { CollectionConfig } from 'payload'

// Team membership is direct, no invite/accept step — unlike list-members,
// a team member is already a trusted, accepted member of the workspace
// itself, so adding them to a team is immediate (same reasoning as adding
// a workspace teammate to a shared list).
export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  fields: [
    { name: 'team', type: 'relationship', relationTo: 'teams', required: true, index: true },
    { name: 'userId', type: 'text', required: true, index: true },
    { name: 'teamRole', type: 'relationship', relationTo: 'team-roles', required: true },
    { name: 'addedBy', type: 'text', required: true },
  ],
  indexes: [{ fields: ['team', 'userId'], unique: true }],
}
