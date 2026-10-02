import type { CollectionConfig } from 'payload'

export const CalendarEvents: CollectionConfig = {
  slug: 'calendar-events',
  admin: { useAsTitle: 'title' },
  hooks: {
    // Invitations reference their event with a NOT NULL column whose FK is
    // ON DELETE SET NULL (Payload's default) — they must go first, or
    // deleting any invited event would fail.
    beforeDelete: [
      async ({ id, req }) => {
        await req.payload.delete({
          collection: 'calendar-event-invitations',
          where: { event: { equals: id } },
          req,
        })
      },
    ],
  },
  fields: [
    { name: 'userId', type: 'text', required: true, index: true },
    {
      name: 'workspace',
      type: 'text',
      required: false,
      index: true,
      admin: {
        description:
          'Better Auth organization id this event belongs to. Empty means the Personal workspace.',
      },
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      required: false,
      index: true,
      admin: {
        description:
          'Optional team (within the same workspace) this event is scoped to — visible only to that team\'s members, and only within the Workspace Calendar (not the global, cross-workspace Calendar). Empty means private to its creator, same as before.',
      },
    },
    {
      name: 'teams',
      type: 'relationship',
      relationTo: 'teams',
      hasMany: true,
      required: false,
      admin: {
        description:
          'Teams a scheduled meeting is linked to (it shows in each of their calendars). Single-team events created from the event dialog use `team` instead.',
      },
    },
    {
      name: 'showAs',
      type: 'select',
      required: false,
      // No default here: set by the server — 'busy' unless chosen for a
      // workspace event, null for a Personal one (see showAsFor).
      options: [
        { label: 'Available', value: 'free' },
        { label: 'Tentative', value: 'tentative' },
        { label: 'Busy', value: 'busy' },
        { label: 'Away', value: 'away' },
      ],
      admin: {
        description:
          'How this event affects the availability of its creator and assignees in the meeting scheduler (Workspace Calendar). Empty for Personal events.',
      },
    },
    {
      name: 'assignedTo',
      type: 'text',
      hasMany: true,
      required: false,
      admin: {
        description:
          'userIds of workspace members this event is assigned to — it shows up in their own agenda in the Workspace Calendar. For a team event, only members of that team.',
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
    // Mirrors the event's category color (gray without one) — see
    // resolveEventColor in api/calendar/actions.ts; never chosen freely.
    { name: 'color', type: 'text', required: false, defaultValue: '#9ca3af' },
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
