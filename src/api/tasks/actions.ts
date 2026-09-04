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
import {
  getCurrentWorkspaceId,
  workspaceWhereClause,
  getWorkspaceRoleForUser,
} from '@/lib/get-current-workspace'
import { canPermanentlyDeleteTask, canModifyWorkspaceContent } from '@/lib/workspace-permissions'
import { getUserPlanLimits, getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'
import {
  resolveListRole,
  canEditListContent,
  canViewList,
  getListMemberIds,
} from '@/lib/list-roles'
import { deleteCommentsForTaskIds } from '@/api/task-comments/actions'

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
  assignedTo?: string[]
}

type EditTaskInput = Partial<
  Pick<Task, 'title' | 'description' | 'tags' | 'subtasks' | 'recurrence' | 'dueDate'>
> & {
  customTags?: number[]
  autoDeleteOnDueDate?: boolean
  listId?: number | null
  assignedTo?: string[]
}

type Subtask = NonNullable<Task['subtasks']>[number]

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

const getUserTimezone = async (): Promise<string> => {
  const session = await getSession()
  const timezone = (session?.user as { timezone?: string } | undefined)?.timezone
  return timezone || 'UTC'
}

function getTaskListId(task: { list?: unknown }): number | null {
  const list = task.list
  if (list && typeof list === 'object') return (list as { id: number }).id
  if (typeof list === 'number') return list
  return null
}

async function assertCanViewTask(
  payload: Awaited<ReturnType<typeof getPayload>>,
  task: { list?: unknown; userId?: string | null },
  userId: string,
): Promise<string | null> {
  const listId = getTaskListId(task)
  if (listId) {
    const role = await resolveListRole(payload, listId, userId)
    return canViewList(role) ? null : 'Not authorized'
  }
  return task.userId === userId ? null : 'Not authorized'
}

async function assertCanEditTask(
  payload: Awaited<ReturnType<typeof getPayload>>,
  task: { list?: unknown; userId?: string | null },
  userId: string,
): Promise<string | null> {
  const listId = getTaskListId(task)
  if (listId) {
    const role = await resolveListRole(payload, listId, userId)
    return canEditListContent(role) ? null : 'Not authorized'
  }
  return task.userId === userId ? null : 'Not authorized'
}

async function assertIsListAdminForTask(
  payload: Awaited<ReturnType<typeof getPayload>>,
  task: { list?: unknown; userId?: string | null },
  userId: string,
): Promise<string | null> {
  const listId = getTaskListId(task)
  if (listId) {
    const role = await resolveListRole(payload, listId, userId)
    return role === 'admin' ? null : 'Not authorized'
  }
  return task.userId === userId ? null : 'Not authorized'
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
        workspace: (task as any).workspace ?? null,
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

    let plan: Awaited<ReturnType<typeof getUserPlanLimits>>['plan']
    let limits: Awaited<ReturnType<typeof getUserPlanLimits>>['limits']
    let role: Awaited<ReturnType<typeof resolveListRole>> = null
    let taskWorkspace: string | null

    if (task.listId) {
      const list = await payload
        .findByID({ collection: 'lists', id: task.listId })
        .catch(() => null)
      if (!list) return err('List not found')

      role = await resolveListRole(payload, task.listId, userId)
      if (!canEditListContent(role)) return err('Not authorized')

      // Task capacity is a property of the list, gated by its owner's plan — not the creator's own plan.
      const ownerLimits = await getPlanLimitsForUserId(list.userId)
      plan = ownerLimits.plan
      limits = ownerLimits.limits
      // A task's workspace always follows its list's workspace, not the
      // creator's current active workspace — relevant for shared lists.
      taskWorkspace = (list as any).workspace ?? null
    } else {
      const own = await getUserPlanLimits()
      plan = own.plan
      limits = own.limits
      taskWorkspace = await getCurrentWorkspaceId()

      const workspaceRole = await getWorkspaceRoleForUser(taskWorkspace, userId)
      if (!canModifyWorkspaceContent(workspaceRole)) return err('Not authorized')
    }

    if (task.listId) {
      const { totalDocs } = await payload.find({
        collection: 'tasks',
        where: {
          and: [{ list: { equals: task.listId } }, { status: { not_equals: 'deleted' } }],
        },
        limit: 0,
      })
      if (isAtLimit(totalDocs, limits.tasksPerList)) {
        return err(
          isPlanUnlimited(plan, 'tasksPerList')
            ? SAFETY_CAP_ERRORS.TASKS_CAP
            : LIMIT_ERRORS.TASKS_LIMIT,
        )
      }
    }

    if ((task.subtasks ?? []).length > limits.subtasksPerTask) {
      return err(
        isPlanUnlimited(plan, 'subtasksPerTask')
          ? SAFETY_CAP_ERRORS.SUBTASKS_CAP
          : LIMIT_ERRORS.SUBTASKS_LIMIT,
      )
    }

    // Only the list admin may assign a task/subtask to members, and only to
    // people who actually belong to that list.
    const memberIds =
      role === 'admin' && task.listId ? await getListMemberIds(payload, task.listId) : []
    const sanitizeAssignees = (assignedTo: string[] | null | undefined) =>
      role === 'admin' && assignedTo
        ? Array.from(new Set(assignedTo)).filter((id) => memberIds.includes(id))
        : []

    const sanitizedSubtasks = (task.subtasks ?? []).map((s) => ({
      ...s,
      assignedTo: sanitizeAssignees(s.assignedTo),
    }))

    const newTask = await payload.create({
      collection: 'tasks',
      data: {
        title: task.title,
        description: task.description ?? '',
        status: initialStatus,
        type: task.type ?? 'simple',
        tags: task.tags ?? [],
        customTags: (task.customTags ?? []) as number[],
        subtasks: sanitizedSubtasks,
        assignedTo: sanitizeAssignees(task.assignedTo),
        ...(task.recurrence && { recurrence: task.recurrence }),
        ...(task.dueDate !== undefined && { dueDate: task.dueDate }),
        autoDeleteOnDueDate: task.autoDeleteOnDueDate ?? false,
        ...(task.listId !== undefined && task.listId !== null && { list: task.listId }),
        workspace: taskWorkspace,
        userId,
      },
    })

    revalidatePath('/')
    return ok(newTask)
  } catch {
    return err('Error while creating the task')
  }
}

export const checkTasksCompliance = async (listId: number) => {
  const userId = await getUserId()
  if (!userId) return null

  const payload = await getPayload({ config })
  const list = await payload.findByID({ collection: 'lists', id: listId })
  if (!list || (list as any).userId !== userId) return null

  const { limits } = await getUserPlanLimits()

  const { docs: activeTasks, totalDocs } = await payload.find({
    collection: 'tasks',
    sort: 'createdAt',
    limit: 0,
    where: {
      and: [
        { list: { equals: listId } },
        { userId: { equals: userId } },
        { status: { not_equals: 'deleted' } },
      ],
    },
  })

  if (totalDocs <= limits.tasksPerList) return null

  return {
    overBy: totalDocs - limits.tasksPerList,
    limit: limits.tasksPerList,
    tasks: activeTasks,
  }
}

export const chooseTasksToKeep = async (listId: number, keepIds: number[]) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const list = await payload.findByID({ collection: 'lists', id: listId })
    if (!list || (list as any).userId !== userId) return err('Not authorized')

    const { limits } = await getUserPlanLimits()
    if (keepIds.length > limits.tasksPerList) {
      return err('TOO_MANY_SELECTED')
    }

    const { docs: activeTasks } = await payload.find({
      collection: 'tasks',
      where: {
        and: [
          { list: { equals: listId } },
          { userId: { equals: userId } },
          { status: { not_equals: 'deleted' } },
        ],
      },
      limit: 0,
    })

    const keepSet = new Set(keepIds)
    const toDelete = activeTasks.filter((t) => !keepSet.has(t.id))

    await deleteCommentsForTaskIds(toDelete.map((t) => t.id))
    for (const task of toDelete) {
      if (task.userId !== userId) continue
      await payload.delete({ collection: 'tasks', id: task.id })
    }

    revalidatePath('/')
    return ok({ deletedCount: toDelete.length })
  } catch {
    return err('Error while updating tasks')
  }
}

export interface SubtasksOverLimitTask {
  taskId: number
  title: string
  subtasks: { id: string; title: string; done: boolean }[]
}

export const checkSubtasksComplianceForList = async (
  listId: number,
): Promise<{ limit: number; tasks: SubtasksOverLimitTask[] } | null> => {
  const userId = await getUserId()
  if (!userId) return null

  const payload = await getPayload({ config })
  const list = await payload.findByID({ collection: 'lists', id: listId })
  if (!list || (list as any).userId !== userId) return null

  const { limits } = await getUserPlanLimits()

  const { docs: tasks } = await payload.find({
    collection: 'tasks',
    where: {
      and: [
        { list: { equals: listId } },
        { userId: { equals: userId } },
        { status: { not_equals: 'deleted' } },
      ],
    },
    limit: 0,
  })

  const overLimit: SubtasksOverLimitTask[] = tasks
    .filter((t) => (t.subtasks ?? []).length > limits.subtasksPerTask)
    .map((t) => ({
      taskId: t.id,
      title: t.title,
      subtasks: ((t.subtasks ?? []) as { id?: string; title: string; done?: boolean }[]).map(
        (s, i) => ({
          id: s.id ?? String(i),
          title: s.title,
          done: s.done ?? false,
        }),
      ),
    }))

  if (overLimit.length === 0) return null

  return { limit: limits.subtasksPerTask, tasks: overLimit }
}

export const chooseSubtasksToKeep = async (taskId: number, keepSubtaskIds: string[]) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id: taskId })
    if (!task || task.userId !== userId) return err('Not authorized')

    const { limits } = await getUserPlanLimits()
    if (keepSubtaskIds.length > limits.subtasksPerTask) {
      return err('TOO_MANY_SELECTED')
    }

    const keepSet = new Set(keepSubtaskIds)
    const subtasks = (task.subtasks ?? []) as { id?: string; title: string }[]
    const filtered = subtasks.filter((s, i) => keepSet.has(s.id ?? String(i)))

    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: { subtasks: filtered } as any,
    })

    revalidatePath('/')
    return ok({ remaining: filtered.length })
  } catch {
    return err('Error while updating subtasks')
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

  // A single list's page shows every task in that list to every member
  // (admin/editor/reader), not just tasks the current viewer happens to have
  // created — the "created by me" filter below is only for cross-list,
  // personal-only views (today/recurring/sidebar) where no listId is given.
  if (listId !== undefined) {
    const role = await resolveListRole(payload, listId, userId)
    if (!role) return { docs: [] }

    return await payload.find({
      collection: 'tasks',
      sort: '-createdAt',
      limit: 0,
      page,
      where: {
        and: [
          { list: { equals: listId } },
          { planArchivedAt: { exists: false } },
          ...(status ? [{ status: { equals: status } }] : []),
        ],
      },
    })
  }

  return await payload.find({
    collection: 'tasks',
    sort: '-createdAt',
    limit: 0,
    page,
    where: {
      and: [
        { userId: { equals: userId } },
        { planArchivedAt: { exists: false } },
        ...(status ? [{ status: { equals: status } }] : []),
      ],
    },
  })
}

function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value

  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) === 24 ? 0 : Number(map.hour),
    Number(map.minute),
    Number(map.second),
  )

  return Math.round((asUTC - date.getTime()) / 60000)
}

function getTodayBoundsInTimezone(timeZone: string): { start: Date; end: Date } {
  const now = new Date()
  const offsetMinutes = getTimezoneOffsetMinutes(now, timeZone)
  const localNow = new Date(now.getTime() + offsetMinutes * 60000)
  const localMidnightUTC = new Date(
    Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 0, 0, 0),
  )
  const start = new Date(localMidnightUTC.getTime() - offsetMinutes * 60000)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

function getWeekdayInTimezone(timeZone: string): (typeof DAYS)[number] {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' })
    .format(new Date())
    .toLowerCase() as (typeof DAYS)[number]
}

export const listTasksToday = async (scope: 'workspace' | 'global' = 'workspace') => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  const timeZone = await getUserTimezone()

  const { start: today, end: tomorrow } = getTodayBoundsInTimezone(timeZone)
  const todayDay = getWeekdayInTimezone(timeZone)

  // The Dashboard's Today widget stays global (aggregates every workspace);
  // the Lists section's Today page is scoped to the active workspace only.
  const workspaceFilter =
    scope === 'workspace' ? [workspaceWhereClause(await getCurrentWorkspaceId())] : []

  const dueTodayTasks = await payload.find({
    collection: 'tasks',
    sort: '-createdAt',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { status: { not_equals: 'deleted' } },
        { planArchivedAt: { exists: false } },
        { dueDate: { greater_than_equal: today.toISOString() } },
        { dueDate: { less_than: tomorrow.toISOString() } },
        ...workspaceFilter,
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
        { planArchivedAt: { exists: false } },
        ...workspaceFilter,
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
  const workspaceId = await getCurrentWorkspaceId()

  return await payload.find({
    collection: 'tasks',
    sort: '-createdAt',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { type: { equals: 'recurring' } },
        { planArchivedAt: { exists: false } },
        workspaceWhereClause(workspaceId),
      ],
    },
  })
}

// Tasks overlaid on the workspace-scoped calendar — unlike the plain
// listTasks() (shared by the global calendar, notifications, mention search,
// etc. and deliberately left unscoped), this one is scoped to the active
// workspace so a task due today in workspace A doesn't bleed onto workspace
// B's calendar.
export const listTasksForWorkspaceCalendar = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  const workspaceId = await getCurrentWorkspaceId()

  return await payload.find({
    collection: 'tasks',
    limit: 0,
    where: {
      and: [
        { userId: { equals: userId } },
        { status: { equals: 'active' } },
        { dueDate: { exists: true } },
        { planArchivedAt: { exists: false } },
        workspaceWhereClause(workspaceId),
      ],
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
  const task = await payload.findByID({ collection: 'tasks', id })

  const authError = await assertCanEditTask(payload, task, userId)
  if (authError) return err(authError)

  return await payload.update({
    collection: 'tasks',
    id,
    data: { status: newStatus },
  })
}

export const deleteTask = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id })

    const authError = await assertIsListAdminForTask(payload, task, userId)
    if (authError) return err(authError)

    const workspaceRole = await getWorkspaceRoleForUser((task as any).workspace ?? null, userId)
    if (!canPermanentlyDeleteTask(workspaceRole)) {
      return err('Only the workspace owner or an admin can permanently delete tasks.')
    }

    await deleteCommentsForTaskIds([id])
    await payload.delete({ collection: 'tasks', id })
    return ok(true)
  } catch {
    return err('Error while deleting the task')
  }
}

export const softDeleteTask = async (taskId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id: taskId })

    const authError = await assertCanEditTask(payload, task, userId)
    if (authError) return err(authError)

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
    const result = await deleteTask(id)
    if (!result.ok) return result
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

    const authError = await assertCanViewTask(payload, task, userId)
    if (authError) return err(authError)

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
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id })

    const authError = await assertCanEditTask(payload, task, userId)
    if (authError) return err(authError)

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
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const originalTask = await payload.findByID({ collection: 'tasks', id })

    const authError = await assertCanEditTask(payload, originalTask, userId)
    if (authError) return err(authError)

    const listId = getTaskListId(originalTask)
    const role = listId ? await resolveListRole(payload, listId, userId) : null

    const finalTitle =
      draft.title !== undefined && draft.title.trim() !== '' ? draft.title : originalTask.title

    if (draft.subtasks != null) {
      let plan: Awaited<ReturnType<typeof getUserPlanLimits>>['plan']
      let limits: Awaited<ReturnType<typeof getUserPlanLimits>>['limits']
      if (listId) {
        const list = await payload.findByID({ collection: 'lists', id: listId })
        ;({ plan, limits } = await getPlanLimitsForUserId(list.userId))
      } else {
        ;({ plan, limits } = await getUserPlanLimits())
      }
      if (draft.subtasks.length > limits.subtasksPerTask) {
        return err(
          isPlanUnlimited(plan, 'subtasksPerTask')
            ? SAFETY_CAP_ERRORS.SUBTASKS_CAP
            : LIMIT_ERRORS.SUBTASKS_LIMIT,
        )
      }
    }

    // Only the list admin may assign a task/subtask to members. A non-admin
    // editor can still edit subtasks (title, description, tags, ...) — we
    // just ignore whatever "assignedTo" they submit and keep the existing
    // assignment for each subtask instead of trusting the client.
    const memberIds = role === 'admin' && listId ? await getListMemberIds(payload, listId) : []
    const sanitizeAssignees = (assignedTo: string[] | null | undefined) =>
      assignedTo ? Array.from(new Set(assignedTo)).filter((mid) => memberIds.includes(mid)) : []

    const originalSubtasks = (originalTask.subtasks ?? []) as Subtask[]
    const sanitizedSubtasks = draft.subtasks?.map((s, i) => ({
      ...s,
      assignedTo:
        role === 'admin'
          ? sanitizeAssignees(s.assignedTo)
          : (originalSubtasks[i]?.assignedTo ?? []),
    }))

    // Moving a task to a different list (or detaching it) changes which
    // workspace it belongs to — keep it in sync with the target list's
    // workspace, or the mover's current active workspace if detached.
    let workspaceUpdate: { workspace?: string | null } = {}
    if (draft.listId !== undefined) {
      if (draft.listId !== null) {
        const newList = await payload.findByID({ collection: 'lists', id: draft.listId })
        workspaceUpdate = { workspace: (newList as any).workspace ?? null }
      } else {
        workspaceUpdate = { workspace: await getCurrentWorkspaceId() }
      }
    }

    const updatedTask = await payload.update({
      collection: 'tasks',
      id,
      data: {
        title: finalTitle,
        ...(draft.description !== undefined && { description: draft.description }),
        ...(draft.tags !== undefined && { tags: draft.tags }),
        ...(draft.customTags !== undefined && { customTags: draft.customTags as number[] }),
        ...(sanitizedSubtasks !== undefined && { subtasks: sanitizedSubtasks }),
        ...(role === 'admin' &&
          draft.assignedTo !== undefined && { assignedTo: sanitizeAssignees(draft.assignedTo) }),
        ...(draft.recurrence !== undefined && { recurrence: draft.recurrence }),
        ...(draft.dueDate !== undefined && { dueDate: draft.dueDate }),
        ...(draft.autoDeleteOnDueDate !== undefined && {
          autoDeleteOnDueDate: draft.autoDeleteOnDueDate,
        }),
        ...(draft.listId !== undefined && { list: draft.listId }),
        ...workspaceUpdate,
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

    const authError = await assertCanViewTask(payload, task, userId)
    if (authError) return err(authError)

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
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id: taskId })

    const authError = await assertCanEditTask(payload, task, userId)
    if (authError) return err(authError)

    const workspaceRole = await getWorkspaceRoleForUser((task as any).workspace ?? null, userId)
    if (!canPermanentlyDeleteTask(workspaceRole)) {
      return err('Only the workspace owner or an admin can permanently delete subtasks.')
    }

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

    const authError = await assertCanViewTask(payload, task, userId)
    if (authError) return err(authError)

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
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const task = await payload.findByID({ collection: 'tasks', id: taskId })

    const authError = await assertCanViewTask(payload, task, userId)
    if (authError) return err(authError)

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
