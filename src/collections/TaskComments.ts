import type { CollectionConfig } from 'payload'

export const TaskComments: CollectionConfig = {
  slug: 'task-comments',
  admin: {
    useAsTitle: 'content',
    description:
      'Comments on tasks belonging to a shared list. Only Plus/Pro members can post; likes/dislikes are open to everyone on the list.',
  },
  fields: [
    {
      name: 'task',
      type: 'relationship',
      relationTo: 'tasks',
      required: true,
      index: true,
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'parentComment',
      type: 'relationship',
      relationTo: 'task-comments',
      required: false,
      index: true,
      admin: {
        description: 'Set when this comment is a reply to another comment on the same task.',
      },
    },
    {
      name: 'mentions',
      type: 'text',
      hasMany: true,
      required: false,
      defaultValue: [],
      admin: {
        description: 'userIds mentioned in this comment, restricted to members of the list.',
      },
    },
    {
      name: 'likes',
      type: 'text',
      hasMany: true,
      required: false,
      defaultValue: [],
    },
    {
      name: 'dislikes',
      type: 'text',
      hasMany: true,
      required: false,
      defaultValue: [],
    },
  ],
}
