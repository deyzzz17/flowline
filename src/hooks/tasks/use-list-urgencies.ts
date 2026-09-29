'use client'

import { useQuery } from '@tanstack/react-query'
import { listMyListUrgencies } from '@/api/tasks/actions'

export const LIST_URGENCIES_QUERY_KEY = ['sidebar', 'list-urgencies']

const DAY_MS = 24 * 60 * 60 * 1000

/** 'red' if the list's next due task is due within a day (or overdue), 'orange' within two. */
export function urgencyFromNextDue(nextDue: string | undefined): 'red' | 'orange' | null {
  if (!nextDue) return null
  const diff = new Date(nextDue).getTime() - Date.now()
  if (diff <= DAY_MS) return 'red'
  if (diff <= 2 * DAY_MS) return 'orange'
  return null
}

/**
 * listId → earliest due date among the viewer's active tasks in that list,
 * for the sidebar's urgency dots. Kept fresh by task mutations (see
 * task-cache.ts), which mark it stale.
 */
export function useListUrgencies() {
  const { data } = useQuery({
    queryKey: LIST_URGENCIES_QUERY_KEY,
    queryFn: () => listMyListUrgencies(),
  })
  return (listId: number) => urgencyFromNextDue(data?.[listId])
}
