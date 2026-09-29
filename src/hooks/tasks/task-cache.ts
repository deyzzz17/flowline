'use client'

import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { Task } from '@/payload-types'
import { LIST_URGENCIES_QUERY_KEY } from './use-list-urgencies'

// Helpers to apply a task mutation's server result directly to every cached
// task query, instead of invalidating ['tasks'] — which refetched every
// mounted task query (including the full list of all the user's tasks) after
// each single edit/create/delete, for data the client already had.

type TaskPage = { docs: Task[]; totalDocs?: number }

/**
 * Task queries whose membership depends on a filter the client can't
 * evaluate (due today, recurring, active workspace…). Updated in place like
 * the others, but also marked stale so they refetch — only if on screen.
 */
const FILTERED_TASK_QUERIES: QueryKey[] = [
  ['tasks', 'today'],
  ['tasks', 'recurring'],
  ['tasks', 'workspace-calendar'],
]

function listIdOf(task: Pick<Task, 'list'>): number | null {
  const list = task.list
  if (list && typeof list === 'object') return list.id
  return typeof list === 'number' ? list : null
}

function isTaskPage(data: unknown): data is TaskPage {
  return !!data && typeof data === 'object' && Array.isArray((data as TaskPage).docs)
}

/** `['tasks', <listId>]` — one list's own tasks. */
function listIdOfKey(key: QueryKey): number | null {
  return key[0] === 'tasks' && key.length === 2 && typeof key[1] === 'number' ? key[1] : null
}

function markFilteredQueriesStale(queryClient: QueryClient) {
  for (const queryKey of FILTERED_TASK_QUERIES) {
    queryClient.invalidateQueries({ queryKey, exact: true })
  }
  // The sidebar's urgency dots (one small grouped query, see use-list-urgencies).
  queryClient.invalidateQueries({ queryKey: LIST_URGENCIES_QUERY_KEY })
}

/**
 * Writes the server's version of a task into every cached task query:
 * replaced where it already is (matched by `id`, or by `replaceId` for an
 * optimistic placeholder), added to its own list's query if missing, and
 * dropped from any other list's query (a task moved to another list, or an
 * optimistic insert that landed in every list).
 */
export function upsertTaskInCaches(
  queryClient: QueryClient,
  task: Task,
  { replaceId, insertIntoAll = false }: { replaceId?: number; insertIntoAll?: boolean } = {},
) {
  const taskListId = listIdOf(task)
  const matches = (t: Task) => t.id === task.id || (replaceId !== undefined && t.id === replaceId)

  for (const [queryKey, data] of queryClient.getQueriesData<TaskPage>({ queryKey: ['tasks'] })) {
    if (!isTaskPage(data)) continue
    const keyListId = listIdOfKey(queryKey)

    if (keyListId !== null && keyListId !== taskListId) {
      if (data.docs.some(matches)) {
        queryClient.setQueryData<TaskPage>(queryKey, {
          ...data,
          docs: data.docs.filter((t) => !matches(t)),
          ...(data.totalDocs !== undefined && { totalDocs: data.totalDocs - 1 }),
        })
      }
      continue
    }

    if (data.docs.some(matches)) {
      queryClient.setQueryData<TaskPage>(queryKey, {
        ...data,
        docs: data.docs.map((t) => (matches(t) ? { ...t, ...task } : t)),
      })
    } else if (keyListId !== null || (insertIntoAll && queryKey.length === 1)) {
      // Its own list's page, or (for a newly created task) the full list of
      // the user's tasks — newest first, like the server sorts them.
      queryClient.setQueryData<TaskPage>(queryKey, {
        ...data,
        docs: [task, ...data.docs],
        ...(data.totalDocs !== undefined && { totalDocs: data.totalDocs + 1 }),
      })
    }
  }

  markFilteredQueriesStale(queryClient)
}

/** Applies a partial server result (e.g. new subtasks/status) to a cached task. */
export function patchTaskInCaches(queryClient: QueryClient, taskId: number, patch: Partial<Task>) {
  queryClient.setQueriesData<TaskPage>({ queryKey: ['tasks'] }, (old) =>
    isTaskPage(old)
      ? { ...old, docs: old.docs.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) }
      : old,
  )
  markFilteredQueriesStale(queryClient)
}

/** Drops a task from every cached task query. */
export function removeTaskFromCaches(queryClient: QueryClient, taskId: number) {
  queryClient.setQueriesData<TaskPage>({ queryKey: ['tasks'] }, (old) =>
    isTaskPage(old) && old.docs.some((t) => t.id === taskId)
      ? {
          ...old,
          docs: old.docs.filter((t) => t.id !== taskId),
          ...(old.totalDocs !== undefined && { totalDocs: old.totalDocs - 1 }),
        }
      : old,
  )
  markFilteredQueriesStale(queryClient)
}
