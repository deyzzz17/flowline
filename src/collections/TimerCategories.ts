import type { CollectionConfig } from 'payload'

export const TimerCategories: CollectionConfig = {
  slug: 'timer-categories',
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
      defaultValue: '#8b5cf6',
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Default categories provided by the app',
      },
    },
  ],
}
