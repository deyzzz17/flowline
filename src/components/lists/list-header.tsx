'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

export const ListHeader = () => {
  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
  })

  const allTasks = data?.docs ?? []
  const todoTasks = allTasks.filter((t) => t.status === 'active')
  const achievedTasks = allTasks.filter((t) => t.status === 'completed')
  const trashedTasks = allTasks.filter((t) => t.status === 'deleted')
  const nonDeletedTasks = allTasks.filter((t) => t.status !== 'deleted')
  const completionRate =
    nonDeletedTasks.length > 0
      ? Math.round((achievedTasks.length / nonDeletedTasks.length) * 100)
      : 0

  return (
    <section className="mb-8 mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
            My workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {allTasks.length === 0
              ? 'No tasks yet, create your first one below.'
              : `${todoTasks.length} active · ${achievedTasks.length} completed · ${trashedTasks.length} trashed`}
          </p>
        </div>

        {nonDeletedTasks.length > 0 && (
          <div className="hidden flex-col items-end gap-1.5 sm:flex">
            <span className="text-xs text-muted-foreground">
              {achievedTasks.length}/{nonDeletedTasks.length} done
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              {completionRate}%
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
