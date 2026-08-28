import 'server-only'

import type { Payload } from 'payload'

export async function getOrCreatePersonalWorkspace(payload: Payload, userId: string) {
  const { docs } = await payload.find({
    collection: 'workspaces',
    where: {
      and: [{ userId: { equals: userId } }, { isPersonal: { equals: true } }],
    },
    limit: 1,
  })

  if (docs[0]) return docs[0]

  return payload.create({
    collection: 'workspaces',
    data: {
      name: 'Personal',
      userId,
      isPersonal: true,
    },
  })
}
