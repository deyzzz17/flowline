import type { CollectionConfig } from 'payload'

export const UserTags: CollectionConfig = {
  slug: 'user-tags',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'color',
      type: 'text',
      required: true,
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
  ],
}
