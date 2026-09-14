import type { CollectionConfig } from 'payload'

// Better Auth owns the `member` table directly (its own migrations, no
// `planArchivedAt`-style field we can safely add to it), so a removed
// member can't be soft-archived in place the way a list or tag can. This
// collection is the parallel record we keep instead: who was removed, from
// which workspace, with what role, so "restore" can re-add them later via
// auth.api.addMember() — instant, no re-invite needed — exactly like
// restoring an archived list clears its planArchivedAt.
export const WorkspaceMemberArchive: CollectionConfig = {
  slug: 'workspace-member-archive',
  admin: {
    useAsTitle: 'userId',
    description:
      'Workspace members removed because a plan downgrade put the workspace over its member limit. Kept here so they can be restored later.',
  },
  fields: [
    { name: 'organizationId', type: 'text', required: true, index: true },
    { name: 'userId', type: 'text', required: true, index: true },
    {
      name: 'role',
      type: 'text',
      required: true,
      admin: { description: 'Their role at the time they were removed, restored as-is.' },
    },
    { name: 'removedBy', type: 'text', required: true },
    { name: 'archivedAt', type: 'date', required: true, index: true },
  ],
}
