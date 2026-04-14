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
  const inactiveTasks = allTasks.filter((t) => t.status !== 'deleted' && t.status !== 'inactive')
  const completionRate =
    inactiveTasks.length > 0 ? Math.round((achievedTasks.length / inactiveTasks.length) * 100) : 0

  return (
    <section className="mb-8 mt-10">
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
            My workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {allTasks.length === 0
              ? 'No tasks yet, create your first one below.'
              : `${todoTasks.length} active · ${achievedTasks.length} completed · ${trashedTasks.length} trashed`}
          </p>

          {inactiveTasks.length > 0 && (
            <div className="mt-3 flex items-center gap-3 sm:hidden">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="text-xs font-semibold shrink-0 text-violet-600 dark:text-violet-400">
                {completionRate}%
              </span>
            </div>
          )}
        </div>

        {inactiveTasks.length > 0 && (
          <div className="hidden flex-col items-end gap-1.5 sm:flex">
            <span className="text-xs text-muted-foreground">
              {achievedTasks.length}/{inactiveTasks.length} done
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
