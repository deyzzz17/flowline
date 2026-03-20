'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { ok, err } from '@/types/result'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export const createTask = async (task: { title: string; description?: string }) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user?.id
    if (!userId) return err('Not authenticated')
    const payload = await getPayload({ config })
    const newTask = await payload.create({
      collection: 'tasks',
      data: {
        ...task,
        status: 'active',
        userId,
      },
    })

    revalidatePath('/')
    return ok(newTask)
  } catch {
    return err('Error while creating the task')
  }
}

export const listTasks = async (status?: 'active' | 'completed' | 'deleted') => {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) return { docs: [] }
  const payload = await getPayload({ config })
  return await payload.find({
    collection: 'tasks',
    sort: '-createdAt',
    where: {
      and: [{ userId: { equals: userId } }, ...(status ? [{ status: { equals: status } }] : [])],
    },
  })
}

export const updateTaskStatus = async (
  id: number,
  newStatus: 'active' | 'completed' | 'deleted',
) => {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) return err('Not authenticated')
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
    return ok(true)
  } catch {
    return err('Error while soft deleting the task')
  }
}

export const moveToTrash = async (id: number) => {
  try {
    await deleteTask(id)
    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while deleting the task')
  }
}

export const toggleTaskStatus = async (id: number, currentStatus: 'active' | 'completed') => {
  try {
    const newStatus = currentStatus === 'active' ? 'completed' : 'active'
    await updateTaskStatus(id, newStatus)
    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while updating the task')
  }
}

export const restoreTask = async (id: number) => {
  try {
    await updateTaskStatus(id, 'active')
    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while restoring the task')
  }
}

export const editTask = async (
  id: number,
  draft: { title: string; description?: string | undefined },
) => {
  try {
    const payload = await getPayload({ config })
    const originalTask = await payload.findByID({ collection: 'tasks', id })
    const finalTitle = draft.title.trim() === '' ? originalTask.title : draft.title
    const finalDescription = draft.description
    const updatedTask = await payload.update({
      collection: 'tasks',
      id,
      data: {
        title: finalTitle,
        description: finalDescription,
      },
    })
    revalidatePath('/')
    return ok(updatedTask)
  } catch {
    return err('Error while editing the task')
  }
}
