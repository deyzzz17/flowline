import type { CollectionConfig } from 'payload'

export const UserTags: CollectionConfig = {
  slug: 'user-tags',
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
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'planArchivedAt',
      type: 'date',
      required: false,
      index: true,
      admin: {
        description:
          'Renseigné quand le tag a été mis de côté suite à un downgrade de plan (dépassement ' +
          'de quota). Tant que ce champ est renseigné, le tag est masqué de la création/sélection, ' +
          "sauf dans l'écran de gestion des tags archivés par downgrade. Les tâches qui utilisaient " +
          'déjà ce tag conservent leur association (pas de cascade).',
      },
    },
  ],
}
