'use server'

import 'server-only'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { ok, err } from '@/types/result'
import { cookies } from 'next/headers'
import { Task } from '@/payload-types'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/get-session'

type CreateTaskInput = {
  title: string
  description?: string
  type?: Task['type']
  tags?: Task['tags']
  customTags?: number[]
  subtasks?: Task['subtasks']
  recurrence?: Task['recurrence']
  dueDate?: string | null
  autoDeleteOnDueDate?: boolean
  listId?: number | null
}

type EditTaskInput = Partial<
  Pick<Task, 'title' | 'description' | 'tags' | 'subtasks' | 'recurrence' | 'dueDate'>
> & {
  customTags?: number[]
  autoDeleteOnDueDate?: boolean
  listId?: number | null
}

type Subtask = NonNullable<Task['subtasks']>[number]

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

const allSubtasksDone = (subtasks: Subtask[]): boolean => {
  if (subtasks.length === 0) return false
  return subtasks.every((s) => s.done)
}

async function createTaskCompletionSnapshot(
  payload: Awaited<ReturnType<typeof getPayload>>,
  task: Task,
  userId: string,
): Promise<void> {
  try {
    const customTagIds = (task.customTags ?? []).map((t: any) => (typeof t === 'object' ? t.id : t))
    const customTagsSnapshot: { id: number; name: string; color: string }[] = []
    for (const tagId of customTagIds) {
      try {
        const tag = await payload.findByID({ collection: 'user-tags', id: tagId })
        customTagsSnapshot.push({ id: tag.id, name: tag.name, color: tag.color })
      } catch {}
    }

    const listId =
      task.list && typeof task.list === 'object'
        ? (task.list as { id: number }).id
        : typeof task.list === 'number'
          ? task.list
          : null
    let listName: string | null = null
    if (listId) {
      try {
        const list = await payload.findByID({ collection: 'lists', id: listId })
        listName = (list as any).name ?? null
      } catch {}
    }

    await payload.create({
      collection: 'task-completions',
      data: {
        userId,
        taskId: task.id,
        taskTitle: task.title,
        completedAt: new Date().toISOString(),
        tags: (task.tags ?? []) as Task['tags'],
        customTagsSnapshot,
        ...(listId !== null && { listId }),
        ...(listName !== null && { listName }),
      },
    })
  } catch (e) {
    console.error('Failed to create task completion snapshot:', e)
  }
}

async function deleteLatestTaskCompletionSnapshot(
  payload: Awaited<ReturnType<typeof getPayload>>,
  taskId: number,
): Promise<void> {
  try {
    const { docs } = await payload.find({
      collection: 'task-completions',
      where: { taskId: { equals: taskId } },
      sort: '-completedAt',
      limit: 1,
    })
    if (docs.length > 0) {
      await payload.delete({ collection: 'task-completions', id: docs[0].id })
    }
  } catch (e) {
    console.error('Failed to delete task completion snapshot:', e)
  }
}

export const createTask = async (task: CreateTaskInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`create-task:${userId}`, 1, 1000)) {
      return err('Too many requests. Please wait a moment.')
    }

    const payload = await getPayload({ config })

    let initialStatus: 'active' | 'inactive' = 'active'
    if (task.type === 'recurring' && task.recurrence?.frequency === 'custom') {
      const today = DAYS[new Date().getDay()]
      initialStatus = task.recurrence.days?.includes(today as never) ? 'active' : 'inactive'
    }

    if (task.listId) {
      const { totalDocs } = await payload.find({
        collection: 'tasks',
        where: {
          and: [{ list: { equals: task.listId } }, { status: { not_equals: 'deleted' } }],
        },
        limit: 0,
      })
      if (totalDocs >= 100) return err('LIMIT_REACHED')
    }

    if ((task.subtasks ?? []).length > 80) {
      return err('SUBTASK_LIMIT_REACHED')
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
        autoDeleteOnDueDate: task.autoDeleteOnDueDate ?? false,
        ...(task.listId !== undefined && task.listId !== null && { list: task.listId }),
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
  listId?: number,
) => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })

  return await payload.find({
    collection: 'tasks',
    sort: '-createdAt',
    limit: 0,
    page,
    where: {
      and: [
        { userId: { equals: userId } },
        ...(status ? [{ status: { equals: status } }] : []),
        ...(listId !== undefined ? [{ list: { equals: listId } }] : []),
      ],
    },
  })
}

export const listTasksToday = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayDay = DAYS[new Date().getDay()]

  const dueTodayTasks = await payload.find({
    collection: 'tasks',
    sort: '-createdAt',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { status: { not_equals: 'deleted' } },
        { dueDate: { greater_than_equal: today.toISOString() } },
        { dueDate: { less_than: tomorrow.toISOString() } },
      ],
    },
  })

  const recurringTasks = await payload.find({
    collection: 'tasks',
    sort: '-createdAt',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { type: { equals: 'recurring' } },
        { status: { in: ['active', 'completed'] } },
      ],
    },
  })

  const recurringToday = recurringTasks.docs.filter((task) => {
    const recurrence = task.recurrence as { frequency: 'daily' | 'custom'; days?: string[] } | null
    if (!recurrence) return false
    return recurrence.frequency === 'daily' || (recurrence.days?.includes(todayDay) ?? false)
  })

  const dueTodayIds = new Set(dueTodayTasks.docs.map((t) => t.id))
  const merged = [...dueTodayTasks.docs, ...recurringToday.filter((t) => !dueTodayIds.has(t.id))]

  return { docs: merged }
}

export const listTasksRecurring = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })

  return await payload.find({
    collection: 'tasks',
    sort: '-createdAt',
    limit: 0,
    where: {
      and: [{ userId: { equals: userId } }, { type: { equals: 'recurring' } }],
    },
  })
}

export const updateTaskStatus = async (
  id: number,
  newStatus: 'active' | 'completed' | 'deleted' | 'inactive',
) => {
  const userId = await getUserId()
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
    const payload = await getPayload({ config })
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        status: 'deleted',
        trashedAt: new Date().toISOString(),
      },
    })
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
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id })

    const subtasks = (task.subtasks ?? []) as NonNullable<Task['subtasks']>
    const hasSubtasks = subtasks.length > 0
    const shouldResetSubtasks = newStatus === 'active' && hasSubtasks

    if (newStatus === 'completed') {
      await createTaskCompletionSnapshot(payload, task as Task, userId)
    } else {
      await deleteLatestTaskCompletionSnapshot(payload, id)
    }

    await payload.update({
      collection: 'tasks',
      id,
      data: {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
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

    await payload.update({
      collection: 'tasks',
      id,
      data: {
        status: newStatus,
        trashedAt: null,
      },
    })
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

    if (draft.subtasks != null && draft.subtasks.length > 80) {
      return err('SUBTASK_LIMIT_REACHED')
    }

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
        ...(draft.autoDeleteOnDueDate !== undefined && {
          autoDeleteOnDueDate: draft.autoDeleteOnDueDate,
        }),
        ...(draft.listId !== undefined && { list: draft.listId }),
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
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id: taskId })

    type Subtask = NonNullable<Task['subtasks']>[number]
    const subtasks = (task.subtasks ?? []) as Subtask[]

    const updatedSubtasks = subtasks.map((s, i) =>
      i === subtaskIndex ? { ...s, done: !s.done } : s,
    )

    const wasCompleted = task.status === 'completed'
    const nowCompleted = allSubtasksDone(updatedSubtasks)
    const newStatus = nowCompleted ? 'completed' : task.status

    if (nowCompleted && !wasCompleted) {
      await createTaskCompletionSnapshot(payload, task as Task, userId)
    }

    if (wasCompleted && !nowCompleted) {
      await deleteLatestTaskCompletionSnapshot(payload, taskId)
    }

    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        subtasks: updatedSubtasks,
        ...(newStatus !== task.status && {
          status: newStatus,
          completedAt: nowCompleted ? new Date().toISOString() : null,
        }),
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
    const userId = await getUserId()
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

      if (shouldBeActive && task.status === 'inactive') {
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

export const completeTaskWithSubtasks = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id })

    type Subtask = NonNullable<Task['subtasks']>[number]
    const subtasks = (task.subtasks ?? []) as Subtask[]

    await createTaskCompletionSnapshot(payload, task as Task, userId)

    await payload.update({
      collection: 'tasks',
      id,
      data: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        subtasks: subtasks.map((s) => ({ ...s, done: true })),
      },
    })
    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while completing task with subtasks')
  }
}

export const uncompleteSubtask = async (taskId: number, subtaskIndex: number) => {
  try {
    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id: taskId })
    type Subtask = NonNullable<Task['subtasks']>[number]
    const subtasks = (task.subtasks ?? []) as Subtask[]
    const updatedSubtasks = subtasks.map((s, i) => (i === subtaskIndex ? { ...s, done: false } : s))
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: {
        status: 'active',
        completedAt: null,
        subtasks: updatedSubtasks,
      },
    })
    revalidatePath('/')
    return ok({ subtasks: updatedSubtasks, status: 'active' })
  } catch {
    return err('Error while uncompleting subtask')
  }
}
