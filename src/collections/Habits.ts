import type { CollectionConfig } from 'payload'

export const Habits: CollectionConfig = {
  slug: 'habits',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'userId', type: 'text', required: true, index: true },
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: false,
      index: true,
      admin: { description: 'Auto-generated from name + userId' },
    },
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
      admin: { condition: (_, s) => s?.frequency === 'days_of_week' },
    },
    {
      name: 'timesPerWeek',
      type: 'number',
      required: false,
      min: 1,
      max: 7,
      admin: { condition: (_, s) => s?.frequency === 'times_per_week' },
    },
    {
      name: 'startDate',
      type: 'date',
      required: false,
      admin: { description: 'Optional start date for the habit' },
    },
    { name: 'archivedAt', type: 'date', required: false },
    { name: 'order', type: 'number', required: false, defaultValue: 0 },

    { name: 'showInCalendar', type: 'checkbox', defaultValue: false },
    {
      name: 'calendarMode',
      type: 'select',
      required: false,
      options: [
        { label: 'Fixed time', value: 'time' },
        { label: 'Relative to event', value: 'relative' },
      ],
      admin: { condition: (_, s) => s?.showInCalendar },
    },
    {
      name: 'habitTime',
      type: 'text',
      required: false,
      admin: {
        description: 'HH:mm format',
        condition: (_, s) => s?.showInCalendar && s?.calendarMode === 'time',
      },
    },
    {
      name: 'habitDuration',
      type: 'number',
      required: false,
      admin: {
        description: 'Duration in minutes',
        condition: (_, s) => s?.showInCalendar,
      },
    },
    {
      name: 'relativePosition',
      type: 'select',
      required: false,
      options: [
        { label: 'Before event', value: 'before' },
        { label: 'After event', value: 'after' },
      ],
      admin: { condition: (_, s) => s?.showInCalendar && s?.calendarMode === 'relative' },
    },
    {
      name: 'relativeEventId',
      type: 'number',
      required: false,
      admin: { condition: (_, s) => s?.showInCalendar && s?.calendarMode === 'relative' },
    },

    {
      name: 'trackingFields',
      type: 'json',
      required: false,
      admin: { description: 'Array of TrackingField objects' },
    },

    {
      name: 'goal',
      type: 'json',
      required: false,
      admin: { description: 'Legacy single HabitGoal — migré vers goals[]' },
    },
    { name: 'goalCompletedAt', type: 'date', required: false },

    {
      name: 'goals',
      type: 'json',
      required: false,
      admin: { description: 'Array of HabitGoal objects' },
    },
  ],
  hooks: {
    afterRead: [
      ({ doc }) => {
        const rawGoals = doc.goals
        const hasGoals = Array.isArray(rawGoals)
          ? rawGoals.length > 0
          : typeof rawGoals === 'string'
            ? (() => {
                try {
                  const p = JSON.parse(rawGoals)
                  return Array.isArray(p) && p.length > 0
                } catch {
                  return false
                }
              })()
            : false

        if (!hasGoals && doc.goal) {
          try {
            const oldGoal = typeof doc.goal === 'string' ? JSON.parse(doc.goal) : doc.goal
            if (oldGoal?.description) {
              doc.goals = JSON.stringify([
                {
                  id: oldGoal.id ?? `goal_legacy_${doc.id}`,
                  type: oldGoal.type ?? 'manual',
                  description: oldGoal.description,
                  fieldTargets:
                    oldGoal.fieldTargets ??
                    (oldGoal.fieldKey
                      ? [{ fieldKey: oldGoal.fieldKey, targetValue: oldGoal.targetValue ?? 10 }]
                      : undefined),
                  endOnReach: oldGoal.endOnReach ?? false,
                  completedAt: doc.goalCompletedAt
                    ? new Date(doc.goalCompletedAt).toISOString()
                    : (oldGoal.completedAt ?? null),
                },
              ])
            }
          } catch {}
        }

        return doc
      },
    ],
    beforeChange: [
      async ({ data, originalDoc }) => {
        const userId = data.userId ?? originalDoc?.userId
        const name = data.name

        if (name) {
          const base = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

          const userSuffix = userId
            ? userId
                .slice(-4)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')
            : ''

          data.slug = userSuffix ? `${base}-${userSuffix}` : base
        }

        return data
      },
    ],
  },
}
