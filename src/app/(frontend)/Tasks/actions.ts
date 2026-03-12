'use server'

import { tasksAPI } from '@/api/tasks'
import { revalidatePath } from 'next/cache'

export async function createTaskAction(task: { title: string; description?: string }) {
  try {
    const newTask = await tasksAPI.create(task)
    revalidatePath('/')
    return { success: true, data: newTask }
  } catch {
    return { success: false, error: 'Error while creating the task' }
  }
}

export async function toggleTaskStatusAction(id: number, currentStatus: 'active' | 'completed') {
  try {
    const newStatus = currentStatus === 'active' ? 'completed' : 'active'
    await tasksAPI.updateStatus(id, newStatus)
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'Error while updating the task' }
  }
}

export async function softDeleteTaskAction(id: number) {
  try {
    await tasksAPI.updateStatus(id, 'deleted')
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'Error while soft deleting the task' }
  }
}

export async function moveToTrashAction(id: number) {
  try {
    await tasksAPI.delete(id)
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'Error while deleting the task' }
  }
}
