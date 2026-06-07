import Link from 'next/link'
import { Play } from 'lucide-react'
import type { Task } from '@/payload-types'

function formatSeconds(s: number): string {
  if (s === 0) return '0m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

interface DashboardPriorityProps {
  task: Task
  weekFocusSeconds: number
}

export function DashboardPriority({ task, weekFocusSeconds }: DashboardPriorityProps) {
  type ListObj = { name?: string | null }
  const listName =
    task.list && typeof task.list === 'object'
      ? ((task.list as ListObj).name ?? 'No project')
      : 'No project'

  return (
    <section className="mb-6">
      <div className="rounded-2xl border border-l-[3px] border-border/60 border-l-orange-500 bg-card/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-md">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top priority
            </p>
            <h3 className="text-base font-semibold text-foreground">{task.title}</h3>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-card border border-border/60 px-2.5 py-0.5 text-xs font-medium text-foreground">
                {listName}
              </span>
              {weekFocusSeconds > 0 && (
                <span className="rounded-full bg-card border border-border/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {formatSeconds(weekFocusSeconds)} focus
                </span>
              )}
            </div>
          </div>
          <Link href="/timer">
            <button className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 active:scale-95 shrink-0">
              <Play className="h-3.5 w-3.5 fill-white" />
              Continue with timer
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
