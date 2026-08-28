import type { CollectionConfig } from 'payload'

export const CalendarEvents: CollectionConfig = {
  slug: 'calendar-events',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'userId', type: 'text', required: true, index: true },
    {
      name: 'workspace',
      type: 'relationship',
      relationTo: 'workspaces',
      required: false,
      index: true,
      admin: {
        description: 'Workspace this event belongs to.',
      },
    },
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
    {
      name: 'recurrence',
      type: 'group',
      required: false,
      fields: [
        {
          name: 'frequency',
          type: 'select',
          required: false,
          options: [
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
          ],
        },
        { name: 'interval', type: 'number', defaultValue: 1, required: false },
        {
          name: 'daysOfWeek',
          type: 'select',
          hasMany: true,
          required: false,
          options: [
            { label: 'Sunday', value: '0' },
            { label: 'Monday', value: '1' },
            { label: 'Tuesday', value: '2' },
            { label: 'Wednesday', value: '3' },
            { label: 'Thursday', value: '4' },
            { label: 'Friday', value: '5' },
            { label: 'Saturday', value: '6' },
          ],
        },
        {
          name: 'monthlyType',
          type: 'select',
          required: false,
          options: [
            { label: 'Day of month', value: 'dayOfMonth' },
            { label: 'Day of week', value: 'dayOfWeek' },
          ],
        },
        {
          name: 'endType',
          type: 'select',
          required: false,
          defaultValue: 'never',
          options: [
            { label: 'Never', value: 'never' },
            { label: 'On date', value: 'onDate' },
            { label: 'After N occurrences', value: 'afterCount' },
          ],
        },
        {
          name: 'endDate',
          type: 'date',
          required: false,
          admin: { condition: (_, s) => s?.endType === 'onDate' },
        },
        {
          name: 'endCount',
          type: 'number',
          required: false,
          admin: { condition: (_, s) => s?.endType === 'afterCount' },
        },
      ],
    },
    {
      name: 'exceptions',
      type: 'array',
      required: false,
      admin: { description: 'Dates excluded from the recurrence' },
      fields: [{ name: 'date', type: 'date', required: true }],
    },
    {
      name: 'adjustments',
      type: 'array',
      required: false,
      admin: { description: 'Series adjustments from a given date (thisAndFollowing)' },
      fields: [
        {
          name: 'fromDate',
          type: 'date',
          required: true,
          admin: {
            description: 'From this occurrence date onwards',
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
        {
          name: 'startDate',
          type: 'date',
          required: false,
          admin: {
            description: 'New start time for occurrences from fromDate',
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          required: false,
          admin: {
            description: 'New end time for occurrences from fromDate',
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
        { name: 'title', type: 'text', required: false },
        { name: 'description', type: 'textarea', required: false },
        { name: 'color', type: 'text', required: false },
        { name: 'categoryId', type: 'number', required: false },
        { name: 'allDay', type: 'checkbox', required: false },
      ],
    },
    {
      name: 'recurrenceId',
      type: 'number',
      required: false,
      index: true,
      admin: { description: 'ID of the parent recurring event (modified occurrence)' },
    },
    {
      name: 'originalDate',
      type: 'date',
      required: false,
      admin: { description: 'The original occurrence date this event overrides' },
    },
  ],
}
