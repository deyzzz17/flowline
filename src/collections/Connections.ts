import type { CollectionConfig } from 'payload'

export const Connections: CollectionConfig = {
  slug: 'connections',
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'requesterId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'userId of the person who sent the connection request',
      },
    },
    {
      name: 'recipientId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'userId of the person who received the connection request',
      },
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
        description: 'Set when the request is accepted',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data
        const { payload } = req
        const { requesterId, recipientId } = data

        if (!requesterId || !recipientId) {
          throw new Error('Missing requester or recipient.')
        }
        if (requesterId === recipientId) {
          throw new Error('You cannot connect with yourself.')
        }

        const existing = await payload.find({
          collection: 'connections',
          where: {
            or: [
              {
                and: [
                  { requesterId: { equals: requesterId } },
                  { recipientId: { equals: recipientId } },
                ],
              },
              {
                and: [
                  { requesterId: { equals: recipientId } },
                  { recipientId: { equals: requesterId } },
                ],
              },
            ],
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          throw new Error('A connection or pending request already exists between these users.')
        }

        return data
      },
    ],
  },
}
