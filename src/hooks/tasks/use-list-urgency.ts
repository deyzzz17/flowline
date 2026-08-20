'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import type { Task } from '@/payload-types'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'

function computeUrgency(tasks: Task[]): 'red' | 'orange' | null {
  const now = Date.now()
  let hasOrange = false
  for (const task of tasks) {
    if (task.status !== 'active' || !task.dueDate) continue
    const diff = new Date(task.dueDate).getTime() - now
    if (diff <= 86400000) return 'red'
    if (diff <= 172800000) hasOrange = true
  }
  return hasOrange ? 'orange' : null
}

// Unlike the sidebar's own ['tasks'] query (scoped to tasks the viewer
// personally created), this reflects every task in the list — the same
// list-scoped, role-checked query the list's own page uses — so a shared
// list's urgency dot is correct for every member, admin included, regardless
// of who actually created the due-soon task.
export function useListUrgency(listId: number) {
  const { data } = useQuery({
    queryKey: ['tasks', listId],
    queryFn: () => api.tasks.list(1, listId),
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  return computeUrgency((data?.docs ?? []) as Task[])
}
