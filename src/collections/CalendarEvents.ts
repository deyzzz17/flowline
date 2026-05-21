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

    {
      name: 'recurrence',
      type: 'group',
      required: false,
      admin: { description: 'Recurrence rule for this event' },
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
          admin: { description: 'How often the event repeats' },
        },
        {
          name: 'interval',
          type: 'number',
          defaultValue: 1,
          required: false,
          admin: { description: 'Repeat every N frequency units (e.g. every 2 weeks)' },
        },
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
          admin: { description: 'For weekly recurrence: which days of the week' },
        },
        {
          name: 'monthlyType',
          type: 'select',
          required: false,
          options: [
            { label: 'Day of month (e.g. every 15th)', value: 'dayOfMonth' },
            { label: 'Day of week (e.g. every 3rd Monday)', value: 'dayOfWeek' },
          ],
          admin: { description: 'For monthly recurrence: how to repeat' },
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
          admin: {
            description: 'Last date of recurrence (used when endType = onDate)',
            condition: (_, siblingData) => siblingData?.endType === 'onDate',
          },
        },
        {
          name: 'endCount',
          type: 'number',
          required: false,
          admin: {
            description: 'Number of occurrences (used when endType = afterCount)',
            condition: (_, siblingData) => siblingData?.endType === 'afterCount',
          },
        },
      ],
    },

    {
      name: 'exceptions',
      type: 'array',
      required: false,
      admin: { description: 'Dates excluded or overridden from the recurrence' },
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: { description: 'The original occurrence date that is excluded/overridden' },
        },
      ],
    },

    {
      name: 'recurrenceId',
      type: 'number',
      required: false,
      index: true,
      admin: {
        description: 'ID of the parent recurring event (set when this is a modified occurrence)',
      },
    },

    {
      name: 'originalDate',
      type: 'date',
      required: false,
      admin: {
        description: 'The original occurrence date this event overrides',
      },
    },
    {
      name: 'seriesId',
      type: 'text',
      admin: { readOnly: false },
    },
  ],
}
