import type { CollectionConfig } from 'payload'

export const CalendarCategories: CollectionConfig = {
  slug: 'calendar-categories',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'userId', type: 'text', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'color', type: 'text', required: true, defaultValue: '#8b5cf6' },
    { name: 'isDefault', type: 'checkbox', defaultValue: false },
  ],
}
