import type { CollectionConfig } from 'payload'

export const GoogleCalendarSyncs: CollectionConfig = {
  slug: 'google-calendar-syncs',
  admin: { hidden: true },
  fields: [
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'nextSyncToken',
      type: 'text',
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
    },
    {
      name: 'calendars',
      type: 'array',
      fields: [
        { name: 'googleId', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'color', type: 'text' },
        { name: 'primary', type: 'checkbox', defaultValue: false },
        { name: 'enabled', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: ['connected', 'disconnected', 'error'],
      defaultValue: 'connected',
    },
    {
      name: 'errorMessage',
      type: 'text',
    },
  ],
}