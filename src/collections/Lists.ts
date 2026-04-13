import type { CollectionConfig } from 'payload'

export const Lists: CollectionConfig = {
  slug: 'lists',
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
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
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
        description: "La liste Todo par défaut créée automatiquement à l'inscription",
      },
    },
  ],
}
