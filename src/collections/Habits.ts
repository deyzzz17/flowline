import type { CollectionConfig } from 'payload'

export const Habits: CollectionConfig = {
  slug: 'habits',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'userId', type: 'text', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: false },
    { name: 'color', type: 'text', defaultValue: '#8b5cf6', required: false },
    { name: 'categoryTag', type: 'text', required: false },
    {
      name: 'frequency',
      type: 'select',
      required: true,
      defaultValue: 'daily',
      options: [
        { label: 'Every day', value: 'daily' },
        { label: 'Specific days of the week', value: 'days_of_week' },
        { label: 'X times per week', value: 'times_per_week' },
      ],
    },
    {
      name: 'daysOfWeek',
      type: 'select',
      hasMany: true,
      required: false,
      options: [
        { label: 'Monday', value: 'mon' },
        { label: 'Tuesday', value: 'tue' },
        { label: 'Wednesday', value: 'wed' },
        { label: 'Thursday', value: 'thu' },
        { label: 'Friday', value: 'fri' },
        { label: 'Saturday', value: 'sat' },
        { label: 'Sunday', value: 'sun' },
      ],
      admin: {
        description: 'Used when frequency = days_of_week',
        condition: (_, s) => s?.frequency === 'days_of_week',
      },
    },
    {
      name: 'timesPerWeek',
      type: 'number',
      required: false,
      min: 1,
      max: 7,
      admin: {
        description: 'Used when frequency = times_per_week',
        condition: (_, s) => s?.frequency === 'times_per_week',
      },
    },
    {
      name: 'archivedAt',
      type: 'date',
      required: false,
      admin: { description: 'Set to archive without deleting' },
    },
    {
      name: 'order',
      type: 'number',
      required: false,
      defaultValue: 0,
      admin: { description: 'Display order' },
    },
  ],
}