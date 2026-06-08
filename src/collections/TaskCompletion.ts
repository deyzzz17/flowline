import type { CollectionConfig } from 'payload'

export const TaskCompletions: CollectionConfig = {
  slug: 'task-completions',
  admin: { useAsTitle: 'taskTitle' },
  fields: [
    { name: 'userId', type: 'text', required: true, index: true },
    { name: 'taskId', type: 'number', required: true, index: true },
    { name: 'taskTitle', type: 'text', required: true },
    {
      name: 'completedAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'tags',
      type: 'select',
      hasMany: true,
      required: false,
      options: [
        { label: 'Urgent', value: 'urgent' },
        { label: 'Work', value: 'work' },
        { label: 'Personal', value: 'personal' },
        { label: 'Health', value: 'health' },
        { label: 'Finance', value: 'finance' },
        { label: 'Learning', value: 'learning' },
      ],
    },
    {
      name: 'customTagsSnapshot',
      type: 'json',
      required: false,
      admin: {
        description: 'Snapshot of custom tags at completion time: [{ id, name, color }]',
      },
    },
    { name: 'listId', type: 'number', required: false, index: true },
    { name: 'listName', type: 'text', required: false },
  ],
}