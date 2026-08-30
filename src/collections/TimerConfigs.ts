import type { CollectionConfig } from 'payload'

export const TimerConfigs: CollectionConfig = {
  slug: 'timer-configs',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'workspace',
      type: 'text',
      required: false,
      index: true,
      admin: {
        description:
          'Better Auth organization id this preset belongs to. Empty means the Personal workspace.',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Auto-generated or user-defined label' },
    },
    {
      name: 'sessionDuration',
      type: 'number',
      required: false,
      admin: { description: 'Seconds — 0 means free mode' },
    },
    {
      name: 'workDuration',
      type: 'number',
      required: false,
    },
    {
      name: 'breakDuration',
      type: 'number',
      required: false,
    },
    {
      name: 'categoryName',
      type: 'text',
      required: false,
    },
    {
      name: 'categoryColor',
      type: 'text',
      required: false,
      defaultValue: '#8b5cf6',
    },
    {
      name: 'subCategory',
      type: 'text',
      required: false,
    },
    {
      name: 'planArchivedAt',
      type: 'date',
      required: false,
      index: true,
      admin: {
        description:
          'Renseigné quand ce preset a été mis de côté suite à un downgrade de plan ' +
          '(dépassement de quota). Masqué de la liste des presets tant que ce champ est ' +
          'renseigné. Autonome — rien en dessous à cacher.',
      },
    },
  ],
}
