'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { ok, err } from '@/types/result'
import { auth } from '@/lib/auth'
import { cookies, headers } from 'next/headers'
import { Task } from '@/payload-types'

type CreateTaskInput = {
  title: string
  description?: string
  type?: Task['type']
  tags?: Task['tags']
  customTags?: number[]
  subtasks?: Task['subtasks']
  recurrence?: Task['recurrence']
  dueDate?: string | null
}

type EditTaskInput = Partial<
  Pick<Task, 'title' | 'description' | 'tags' | 'subtasks' | 'recurrence' | 'dueDate'>
> & {
  customTags?: number[]
}

type Subtask = NonNullable<Task['subtasks']>[number]

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const getSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

const allSubtasksDone = (subtasks: Subtask[]): boolean => {
  if (subtasks.length === 0) return false
  return subtasks.every((s) => s.done)
}

export const createTask = async (task: CreateTaskInput) => {
  try {
    const userId = await getSession()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    let initialStatus: 'active' | 'inactive' = 'active'
    if (task.type === 'recurring' && task.recurrence?.frequency === 'custom') {
      const today = DAYS[new Date().getDay()]
      initialStatus = task.recurrence.days?.includes(today as never) ? 'active' : 'inactive'
    }

    const newTask = await payload.create({
      collection: 'tasks',
      data: {
        title: task.title,
        description: task.description ?? '',
        status: initialStatus,
        type: task.type ?? 'simple',
        tags: task.tags ?? [],
        customTags: (task.customTags ?? []) as number[],
        subtasks: task.subtasks ?? [],
        ...(task.recurrence && { recurrence: task.recurrence }),
        ...(task.dueDate !== undefined && { dueDate: task.dueDate }),
        userId,
      },
    })

    revalidatePath('/')
    return ok(newTask)
  } catch {
    return err('Error while creating the task')
  }
}

export const listTasks = async (
  page = 1,
  status?: 'active' | 'completed' | 'deleted' | 'inactive',
) => {
  const userId = await getSession()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })

  return await payload.find({
    collection: 'tasks',
    sort: '-createdAt',
    limit: 0,
    page,
    where: {
      and: [{ userId: { equals: userId } }, ...(status ? [{ status: { equals: status } }] : [])],
    },
  })
}

export const updateTaskStatus = async (
  id: number,
  newStatus: 'active' | 'completed' | 'deleted' | 'inactive',
) => {
  const userId = await getSession()
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
  return await payload.delete({ collection: 'tasks', id })
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

    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id })

    const subtasks = (task.subtasks ?? []) as NonNullable<Task['subtasks']>
    const hasSubtasks = subtasks.length > 0
    const shouldResetSubtasks = newStatus === 'active' && hasSubtasks

    await payload.update({
      collection: 'tasks',
      id,
      data: {
        status: newStatus,
        ...(shouldResetSubtasks && {
          subtasks: subtasks.map((s) => ({ ...s, done: false })),
        }),
      },
    })

    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while updating the task')
  }
}

export const restoreTask = async (id: number) => {
  try {
    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id })

    let newStatus: 'active' | 'inactive' = 'active'

    if (task.type === 'recurring') {
      const recurrence = task.recurrence as {
        frequency: 'daily' | 'custom'
        days?: string[]
      } | null

      if (recurrence?.frequency === 'custom') {
        const today = DAYS[new Date().getDay()]
        newStatus = recurrence.days?.includes(today) ? 'active' : 'inactive'
      }
    }

    await updateTaskStatus(id, newStatus)
    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while restoring the task')
  }
}

export const editTask = async (id: number, draft: EditTaskInput) => {
  try {
    const payload = await getPayload({ config })
    const originalTask = await payload.findByID({ collection: 'tasks', id })

    const finalTitle =
      draft.title !== undefined && draft.title.trim() !== '' ? draft.title : originalTask.title

    const updatedTask = await payload.update({
      collection: 'tasks',
      id,
      data: {
        title: finalTitle,
        ...(draft.description !== undefined && { description: draft.description }),
        ...(draft.tags !== undefined && { tags: draft.tags }),
        ...(draft.customTags !== undefined && { customTags: draft.customTags as number[] }),
        ...(draft.subtasks !== undefined && { subtasks: draft.subtasks }),
        ...(draft.recurrence !== undefined && { recurrence: draft.recurrence }),
        ...(draft.dueDate !== undefined && { dueDate: draft.dueDate }),
      },
    })

    revalidatePath('/')
    return ok(updatedTask)
  } catch {
    return err('Error while editing the task')
  }
}

export const toggleSubtask = async (taskId: number, subtaskIndex: number) => {
  try {
    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id: taskId })

    type Subtask = NonNullable<Task['subtasks']>[number]
    const subtasks = (task.subtasks ?? []) as Subtask[]

    const updatedSubtasks = subtasks.map((s, i) =>
      i === subtaskIndex ? { ...s, done: !s.done } : s,
    )

    const newStatus = allSubtasksDone(updatedSubtasks) ? 'completed' : task.status

    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        subtasks: updatedSubtasks,
        ...(newStatus !== task.status && { status: newStatus }),
      },
    })

    revalidatePath('/')
    return ok({ subtasks: updatedSubtasks, status: newStatus })
  } catch {
    return err('Error while toggling subtask')
  }
}

export const deleteSubtask = async (taskId: number, subtaskIndex: number) => {
  try {
    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id: taskId })

    type Subtask = NonNullable<Task['subtasks']>[number]
    const subtasks = (task.subtasks ?? []) as Subtask[]
    const updatedSubtasks = subtasks.filter((_, i) => i !== subtaskIndex)

    const wasCompleted = task.status === 'completed'
    const newStatus = wasCompleted && updatedSubtasks.length === 0 ? 'active' : task.status

    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        subtasks: updatedSubtasks,
        ...(newStatus !== task.status && { status: newStatus }),
      },
    })

    revalidatePath('/')
    return ok({ subtasks: updatedSubtasks, status: newStatus })
  } catch {
    return err('Error while deleting subtask')
  }
}

export const syncRecurringTasksForUser = async () => {
  try {
    const userId = await getSession()
    if (!userId) return

    const payload = await getPayload({ config })
    const today = DAYS[new Date().getDay()]

    const { docs } = await payload.find({
      collection: 'tasks',
      where: {
        and: [
          { userId: { equals: userId } },
          { type: { equals: 'recurring' } },
          { status: { not_equals: 'deleted' } },
        ],
      },
      limit: 0,
    })

    for (const task of docs) {
      const recurrence = task.recurrence as {
        frequency: 'daily' | 'custom'
        days?: string[]
      } | null

      if (!recurrence) continue

      const shouldBeActive =
        recurrence.frequency === 'daily' || (recurrence.days?.includes(today) ?? false)

      const subtasks = (task.subtasks ?? []) as NonNullable<Task['subtasks']>

      if (shouldBeActive && (task.status === 'inactive' || task.status === 'completed')) {
        await payload.update({
          collection: 'tasks',
          id: task.id,
          data: {
            status: 'active',
            subtasks: subtasks.map((s) => ({ ...s, done: false })),
          },
        })
      } else if (!shouldBeActive && (task.status === 'active' || task.status === 'completed')) {
        await payload.update({
          collection: 'tasks',
          id: task.id,
          data: {
            status: 'inactive',
            subtasks: subtasks.map((s) => ({ ...s, done: false })),
          },
        })
      }
    }
  } catch (e) {
    console.error('syncRecurringTasksForUser error:', e)
  }
}

export const syncIfNeeded = async (userTimezone: string) => {
  const cookieStore = await cookies()

  const today = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const lastSync = cookieStore.get('tasks_last_sync')?.value
  if (lastSync === today) return

  await syncRecurringTasksForUser()
  cookieStore.set('tasks_last_sync', today, { httpOnly: true, maxAge: 60 * 60 * 24 })
}
