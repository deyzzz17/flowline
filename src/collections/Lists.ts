import type { CollectionConfig } from 'payload'

export const Lists: CollectionConfig = {
  slug: 'lists',
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
      name: 'slug',
      type: 'text',
      required: false,
      index: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated from name',
      },
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'category',
      type: 'group',
      required: false,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: false,
        },
        {
          name: 'color',
          type: 'text',
          required: false,
          defaultValue: '#8b5cf6',
        },
      ],
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: "La liste Todo par défaut créée automatiquement à l'inscription",
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const { payload } = req
        const userId = data.userId ?? originalDoc?.userId
        const name = data.name

        if (userId && name) {
          const existing = await payload.find({
            collection: 'lists',
            where: {
              and: [{ userId: { equals: userId } }, { name: { equals: name } }],
            },
            limit: 1,
          })

          const conflict = existing.docs.find(
            (doc) => operation === 'create' || doc.id !== originalDoc?.id,
          )

          if (conflict) {
            throw new Error(`A list named "${name}" already exists.`)
          }
        }

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
