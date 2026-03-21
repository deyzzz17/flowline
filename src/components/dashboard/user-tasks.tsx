import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Task } from '@/payload-types'

interface DashboardTasksProps {
  tasks: Task[]
  completedCount: number
  totalCount: number
}

export const DashboardTasks = ({ tasks, completedCount, totalCount }: DashboardTasksProps) => {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-violet-500 dark:text-violet-400" />
          <span className="text-sm font-semibold text-foreground">Today&apos;s Tasks</span>
        </div>
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {completedCount}/{totalCount}
              </span>
            </div>
          )}
          <Link
            href="/lists"
            className="flex items-center gap-1 text-xs font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="p-5">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Sparkles className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Start by creating your first task.
            </p>
            <Link
              href="/lists"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-500/20 transition-all hover:bg-violet-500 hover:-translate-y-px"
            >
              Create a task
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0"
              >
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-border">
                  <div className="h-1.5 w-1.5 rounded-full" />
                </div>
                <span className="flex-1 text-sm text-foreground">{task.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
