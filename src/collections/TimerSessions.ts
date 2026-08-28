import type { CollectionConfig } from 'payload'

export const TimerSessions: CollectionConfig = {
  slug: 'timer-sessions',
  admin: {
    useAsTitle: 'categoryName',
  },
  fields: [
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'workspace',
      type: 'relationship',
      relationTo: 'workspaces',
      required: false,
      index: true,
      admin: {
        description: 'Workspace this session belongs to.',
      },
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'duration',
      type: 'number',
      required: true,
      admin: { description: 'Duration in seconds' },
    },
    {
      name: 'categoryName',
      type: 'text',
      required: false,
    },
    {
      name: 'categoryColor',
      type: 'text',
      required: false,
      defaultValue: '#8b5cf6',
    },
    {
      name: 'subCategory',
      type: 'text',
      required: false,
    },
    {
      name: 'subCategoryColor',
      type: 'text',
      required: false,
      defaultValue: '#8b5cf6',
    },
    {
      name: 'taskId',
      type: 'number',
      required: false,
    },
    {
      name: 'taskTitle',
      type: 'text',
      required: false,
    },
    {
      name: 'rating',
      type: 'number',
      required: false,
      min: 0,
      max: 5,
      admin: { description: 'Session rating from 0 to 5 (0.5 increments)' },
    },
    {
      name: 'taskCompleted',
      type: 'checkbox',
      required: false,
    },
    {
      name: 'timezoneOffset',
      type: 'number',
      required: false,
      defaultValue: 0,
    },
  ],
}
