import type { CollectionConfig } from 'payload'

export const Workspaces: CollectionConfig = {
  slug: 'workspaces',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      defaultValue: 'Personal',
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Owner of this workspace.',
      },
    },
    {
      name: 'isPersonal',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description:
          'The default workspace every user gets automatically. There is exactly one per user; it cannot be deleted.',
      },
    },
  ],
}
