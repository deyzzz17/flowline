import type { CollectionConfig } from 'payload'

export const TimerCategories: CollectionConfig = {
  slug: 'timer-categories',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'color',
      type: 'text',
      required: true,
      defaultValue: '#8b5cf6',
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'workspace',
      type: 'relationship',
      relationTo: 'workspaces',
      required: false,
      index: true,
      admin: {
        description: 'Workspace this category belongs to.',
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Default categories provided by the app',
      },
    },
    {
      name: 'planArchivedAt',
      type: 'date',
      required: false,
      index: true,
      admin: {
        description:
          'Renseigné quand la catégorie a été mise de côté suite à un downgrade de plan ' +
          '(dépassement de quota). Masquée de la création/sélection tant que ce champ est ' +
          'renseigné. Les sessions timer déjà enregistrées ne sont pas affectées (elles stockent ' +
          'leur nom/couleur en dur, pas de relation vivante).',
      },
    },
  ],
}
