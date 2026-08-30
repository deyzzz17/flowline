import type { CollectionConfig } from 'payload'

export const Lists: CollectionConfig = {
  slug: 'lists',
  admin: {
    useAsTitle: 'name',
  },
  // Postgres treats every NULL as distinct in a unique index, so this index
  // alone doesn't protect Personal (workspace IS NULL) lists from duplicate
  // names under concurrency. That guarantee is restored by a hand-applied
  // partial index Payload's declarative config can't express:
  //   CREATE UNIQUE INDEX personal_list_user_slug_idx ON lists (user_id, slug) WHERE workspace IS NULL
  indexes: [
    {
      fields: ['workspace', 'slug'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: false,
      index: true,
      admin: {
        readOnly: false,
        description: 'Auto-generated from name',
      },
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'workspace',
      type: 'text',
      required: false,
      index: true,
      admin: {
        description:
          'Better Auth organization id this list belongs to. Empty means the Personal workspace (which is not an organization).',
      },
    },
    {
      name: 'category',
      type: 'group',
      required: false,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: false,
        },
        {
          name: 'color',
          type: 'text',
          required: false,
          defaultValue: '#8b5cf6',
        },
      ],
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'The default “To-Do” list created automatically upon registration',
      },
    },
    {
      name: 'isShared',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description:
          'True once this list has had at least one member invited. One-way flag — never reset to false.',
      },
    },
    {
      name: 'planArchivedAt',
      type: 'date',
      required: false,
      index: true,
      admin: {
        description:
          'Indicates when the list was set aside following a plan downgrade (quota exceeded). ' +
          'As long as this field is filled in, the list and its tasks are hidden throughout the app, except in ' +
          'The screen for managing lists archived via downgrade. This is distinct from any other archiving concept.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const { payload } = req
        const userId = data.userId ?? originalDoc?.userId
        const workspaceId = data.workspace ?? originalDoc?.workspace ?? null
        const name = data.name
        // The (workspace, slug) unique index only protects organization workspaces —
        // Postgres treats every NULL workspace as distinct, so Personal lists (no
        // organization) are de-duplicated here by (userId, slug) instead.
        if (userId && name) {
          const existing = await payload.find({
            collection: 'lists',
            where: {
              and: [
                workspaceId
                  ? { workspace: { equals: workspaceId } }
                  : { and: [{ userId: { equals: userId } }, { workspace: { exists: false } }] },
                { name: { equals: name } },
              ],
            },
            limit: 1,
          })
          const conflict = existing.docs.find(
            (doc) => operation === 'create' || doc.id !== originalDoc?.id,
          )
          if (conflict) {
            throw new Error(`A list named "${name}" already exists.`)
          }
        }
        if (name) {
          const base = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
          const userSuffix = userId
            ? userId
                .slice(-4)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')
            : ''
          data.slug = userSuffix ? `${base}-${userSuffix}` : base
        }
        return data
      },
    ],
  },
}
