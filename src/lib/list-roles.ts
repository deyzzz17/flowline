import type { BasePayload } from 'payload'

export type ListRole = 'admin' | 'editor' | 'reader' | null

export async function resolveListRole(
  payload: BasePayload,
  listId: number,
  userId: string,
): Promise<ListRole> {
  const list = await payload.findByID({ collection: 'lists', id: listId }).catch(() => null)
  if (!list) return null
  if (list.userId === userId) return 'admin'
  if (!list.isShared) return null

  const { docs } = await payload.find({
    collection: 'list-members',
    where: {
      and: [
        { list: { equals: listId } },
        { userId: { equals: userId } },
        { status: { equals: 'accepted' } },
      ],
    },
    limit: 1,
  })

  const role = docs[0]?.role
  return role === 'editor' || role === 'reader' ? role : null
}

export async function resolveListRoleForTask(
  payload: BasePayload,
  taskId: number,
  userId: string,
): Promise<ListRole> {
  const task = await payload.findByID({ collection: 'tasks', id: taskId }).catch(() => null)
  if (!task || !task.list) return null
  const listId = typeof task.list === 'object' ? task.list.id : task.list
  return resolveListRole(payload, listId, userId)
}

export function canEditListContent(role: ListRole): boolean {
  return role === 'admin' || role === 'editor'
}

export function canViewList(role: ListRole): boolean {
  return role === 'admin' || role === 'editor' || role === 'reader'
}
