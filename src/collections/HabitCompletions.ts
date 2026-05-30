import type { CollectionConfig } from 'payload'

export const HabitCompletions: CollectionConfig = {
  slug: 'habit-completions',
  admin: { useAsTitle: 'habitId' },
  fields: [
    { name: 'userId', type: 'text', required: true, index: true },
    { name: 'habitId', type: 'number', required: true, index: true },
    {
      name: 'completedAt',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'note', type: 'text', required: false },
    {
      name: 'trackingValues',
      type: 'json',
      required: false,
      admin: { description: 'Record<fieldKey, number | string | boolean>' },
    },
  ],
}
