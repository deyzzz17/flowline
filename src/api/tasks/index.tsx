import { getPayload } from 'payload'
import config from '@/payload.config'

export const tasksAPI = {
  async create(task: { title: string; description?: string }) {
    const payload = await getPayload({ config })
    return await payload.create({
      collection: 'tasks',
      data: {
        ...task,
        status: 'active',
      },
    })
  },

  async list(status?: 'active' | 'completed' | 'deleted') {
    const payload = await getPayload({ config })
    return await payload.find({
      collection: 'tasks',
      sort: '-createdAt',
      where: status
        ? {
            status: {
              equals: status,
            },
          }
        : undefined,
    })
  },

  async updateStatus(id: number, newStatus: 'active' | 'completed' | 'deleted') {
    const payload = await getPayload({ config })
    return await payload.update({
      collection: 'tasks',
      id,
      data: { status: newStatus },
    })
  },

  async delete(id: number) {
    const payload = await getPayload({ config })
    return await payload.delete({
      collection: 'tasks',
      id: id,
    })
  },
}
