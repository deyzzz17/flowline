import type { CollectionConfig } from 'payload'

export const CalendarEvents: CollectionConfig = {
  slug: 'calendar-events',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'userId', type: 'text', required: true, index: true },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: false },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'allDay', type: 'checkbox', defaultValue: false },
    { name: 'color', type: 'text', required: false, defaultValue: '#8b5cf6' },
    {
      name: 'categoryId',
      type: 'number',
      required: false,
      admin: { description: 'Reference to calendar-categories id' },
    },
  ],
}
