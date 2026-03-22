import { InfiniteData } from '@tanstack/react-query'
import type { Task } from '@/payload-types'
import type { TasksPage } from '@/types/task-page'

export type TasksCache = InfiniteData<TasksPage>

export function updateTaskInCache(
  old: TasksCache | undefined,
  updater: (task: Task) => Task,
): TasksCache | undefined {
  if (!old) return old
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      docs: page.docs.map(updater),
    })),
  }
}

export function removeTaskFromCache(
  old: TasksCache | undefined,
  id: number,
): TasksCache | undefined {
  if (!old) return old
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      docs: page.docs.filter((task) => task.id !== id),
    })),
  }
}

export function addTaskToCache(old: TasksCache | undefined, task: Task): TasksCache | undefined {
  if (!old) return old
  return {
    ...old,
    pages: [{ ...old.pages[0], docs: [task, ...old.pages[0].docs] }, ...old.pages.slice(1)],
  }
}
