import type { CollectionConfig } from 'payload'

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: false },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Deleted', value: 'deleted' },
        { label: 'Inactive', value: 'inactive' },
      ],
      required: true,
    },
    { name: 'userId', type: 'text', required: true, index: true },
    { name: 'list', type: 'relationship', relationTo: 'lists', required: false, index: true },
    {
      name: 'assignedTo',
      type: 'text',
      hasMany: true,
      required: false,
      admin: {
        description:
          'userIds of shared-list members this task is assigned to. Only the list admin may set this.',
      },
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'simple',
      options: [
        { label: 'Simple', value: 'simple' },
        { label: 'Recurring', value: 'recurring' },
      ],
      required: true,
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
      name: 'customTags',
      type: 'relationship',
      relationTo: 'user-tags',
      hasMany: true,
      required: false,
    },
    {
      name: 'subtasks',
      type: 'array',
      required: false,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'done', type: 'checkbox', defaultValue: false },
        { name: 'description', type: 'textarea' },
        { name: 'dueDate', type: 'date' },
        { name: 'assignedTo', type: 'text', hasMany: true, required: false },
        {
          name: 'tags',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Urgent', value: 'urgent' },
            { label: 'Work', value: 'work' },
            { label: 'Personal', value: 'personal' },
            { label: 'Health', value: 'health' },
            { label: 'Finance', value: 'finance' },
            { label: 'Learning', value: 'learning' },
          ],
        },
      ],
    },
    {
      name: 'recurrence',
      type: 'group',
      required: false,
      admin: { condition: (data) => data.type === 'recurring' },
      fields: [
        {
          name: 'frequency',
          type: 'select',
          options: [
            { label: 'Every day', value: 'daily' },
            { label: 'Custom days', value: 'custom' },
          ],
        },
        {
          name: 'days',
          type: 'select',
          hasMany: true,
          required: false,
          admin: { condition: (_, siblingData) => siblingData?.frequency === 'custom' },
          options: [
            { label: 'Monday', value: 'mon' },
            { label: 'Tuesday', value: 'tue' },
            { label: 'Wednesday', value: 'wed' },
            { label: 'Thursday', value: 'thu' },
            { label: 'Friday', value: 'fri' },
            { label: 'Saturday', value: 'sat' },
            { label: 'Sunday', value: 'sun' },
          ],
        },
      ],
    },
    { name: 'dueDate', type: 'date', required: false },
    {
      name: 'completedAt',
      type: 'date',
      required: false,
      index: true,
      admin: {
        description: 'Date when the task was marked as completed. Used for analytics.',
        readOnly: true,
      },
    },
    {
      name: 'estimatedDuration',
      type: 'number',
      required: false,
      admin: { description: 'Estimated duration in minutes. Used for calendar display.' },
    },
    {
      name: 'autoDeleteOnDueDate',
      type: 'checkbox',
      defaultValue: false,
      required: false,
      admin: { description: 'Automatically move to trash when the due date is passed.' },
    },
    {
      name: 'trashedAt',
      type: 'date',
      required: false,
      index: true,
      admin: { description: 'Date when the task was soft deleted.', readOnly: true },
    },
    {
      name: 'planArchivedAt',
      type: 'date',
      required: false,
      index: true,
      admin: {
        description:
          'Unlinked from the parent list: set when this task s list was ' +
          'set aside following a plan downgrade. Updated in bulk each time the list is archived/' +
          'restored — do not modify directly.',
        readOnly: true,
      },
    },
  ],
}
