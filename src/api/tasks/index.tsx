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

  async getAll() {
    const payload = await getPayload({ config })
    return await payload.find({
      collection: 'tasks',
      sort: '-createdAt',
    })
  },

  async updateStatus(id: string, newStatus: 'active' | 'completed') {
    const payload = await getPayload({ config })
    return await payload.update({
      collection: 'tasks',
      id,
      data: { status: newStatus },
    })
  },
}
