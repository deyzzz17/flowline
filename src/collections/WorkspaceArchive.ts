import type { CollectionConfig } from 'payload'

// Same constraint as WorkspaceMemberArchive: Better Auth owns the
// `organization` table directly, so a workspace over its plan's count limit
// can't be soft-archived in place. This collection is the parallel record
// instead — the organization itself is never touched (not deleted, not
// modified), only marked archived here. Every access check that resolves a
// workspace role (getWorkspaceRoleForUser, getCurrentWorkspaceId) treats a
// row here as "nobody has access, owner included" until it's removed again
// by restoreWorkspace().
export const WorkspaceArchive: CollectionConfig = {
  slug: 'workspace-archive',
  admin: {
    useAsTitle: 'organizationId',
    description:
      'Workspaces removed from view because a plan downgrade put their owner over the workspace-count limit. The organization itself is untouched — restoring just deletes this row.',
  },
  fields: [
    { name: 'organizationId', type: 'text', required: true, index: true, unique: true },
    { name: 'ownerId', type: 'text', required: true, index: true },
    { name: 'archivedAt', type: 'date', required: true, index: true },
  ],
}
