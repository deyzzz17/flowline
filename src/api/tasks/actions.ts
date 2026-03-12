'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'

export const createTask = async (task: { title: string; description?: string }) => {
  try {
    const payload = await getPayload({ config })
    const newTask = await payload.create({
      collection: 'tasks',
      data: {
        ...task,
        status: 'active',
      },
    })

    revalidatePath('/')
    return { success: true, data: newTask }
  } catch {
    return { success: false, error: 'Error while creating the task' }
  }
}

export const listTasks = async (status?: 'active' | 'completed' | 'deleted') => {
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
}

export const updateTaskStatus = async (
  id: number,
  newStatus: 'active' | 'completed' | 'deleted',
) => {
  const payload = await getPayload({ config })
  return await payload.update({
    collection: 'tasks',
    id,
    data: { status: newStatus },
  })
}

export const deleteTask = async (id: number) => {
  const payload = await getPayload({ config })
  return await payload.delete({
    collection: 'tasks',
    id: id,
  })
}

export const softDeleteTask = async (taskId: number) => {
  try {
    await updateTaskStatus(taskId, 'deleted')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'Error while soft deleting the task' }
  }
}

export const moveToTrash = async (id: number) => {
  try {
    await deleteTask(id)
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'Error while deleting the task' }
  }
}

export const toggleTaskStatus = async (id: number, currentStatus: 'active' | 'completed') => {
  try {
    const newStatus = currentStatus === 'active' ? 'completed' : 'active'
    await updateTaskStatus(id, newStatus)
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'Error while updating the task' }
  }
}

// type Result<T, E> monad
// ok(data), err(error)
// const result = createTask()
// if (isOk(result)) { result.data.title }
// if (isErr(result)) { result.error.message }
// result.match({
//  isOk: (data) => {...},
//  isErr: (error) => {...}
// })
