import type { CollectionConfig } from 'payload'

export const CalendarCategories: CollectionConfig = {
  slug: 'calendar-categories',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'userId', type: 'text', required: true, index: true },
    {
      name: 'workspace',
      type: 'text',
      required: false,
      index: true,
      admin: {
        description:
          'Better Auth organization id this category belongs to. Empty means the Personal workspace.',
      },
    },
    { name: 'name', type: 'text', required: true },
    { name: 'color', type: 'text', required: true, defaultValue: '#8b5cf6' },
    { name: 'isDefault', type: 'checkbox', defaultValue: false },
    {
      name: 'planArchivedAt',
      type: 'date',
      required: false,
      index: true,
      admin: {
        description:
          'Renseigné quand la catégorie a été mise de côté suite à un downgrade de plan ' +
          '(dépassement de quota). Masquée de la création/sélection tant que ce champ est ' +
          'renseigné. Les événements calendrier déjà créés avec cette catégorie restent visibles ' +
          'normalement (pas de cascade — décision produit).',
      },
    },
  ],
}
