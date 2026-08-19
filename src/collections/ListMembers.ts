import type { CollectionConfig } from 'payload'

export const ListMembers: CollectionConfig = {
  slug: 'list-members',
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'list',
      type: 'relationship',
      relationTo: 'lists',
      required: true,
      index: true,
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'userId of the invited/member user',
      },
    },
    {
      name: 'invitedBy',
      type: 'text',
      required: true,
      admin: {
        description: 'userId of the admin who sent the invite',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Editor', value: 'editor' },
        { label: 'Reader', value: 'reader' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
      ],
      index: true,
    },
    {
      name: 'respondedAt',
      type: 'date',
      required: false,
      admin: {
        description: 'Set when the invite is accepted',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data
        const { payload } = req
        const { list, userId, invitedBy } = data

        if (!list || !userId || !invitedBy) {
          throw new Error('Missing list, userId or invitedBy.')
        }
        if (userId === invitedBy) {
          throw new Error('You cannot invite yourself.')
        }

        const listId = typeof list === 'object' ? list.id : list
        const existing = await payload.find({
          collection: 'list-members',
          where: {
            and: [{ list: { equals: listId } }, { userId: { equals: userId } }],
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          throw new Error('This user is already invited to or a member of this list.')
        }

        return data
      },
    ],
  },
}
