import Link from 'next/link'
import { Target, ArrowRight } from 'lucide-react'
import type { HabitWithStats } from '@/api/habits/actions'

interface DashboardGoalsProps {
  habits: HabitWithStats[]
}

const GOAL_COLORS = [
  { bar: 'from-violet-500 to-purple-500', dot: 'bg-violet-500' },
  { bar: 'from-teal-500 to-emerald-500', dot: 'bg-teal-500' },
  { bar: 'from-blue-500 to-cyan-500', dot: 'bg-blue-500' },
  { bar: 'from-pink-500 to-rose-500', dot: 'bg-pink-500' },
  { bar: 'from-amber-500 to-orange-500', dot: 'bg-amber-500' },
]

export function DashboardGoals({ habits }: DashboardGoalsProps) {
  const habitsWithGoals = habits.filter((h) => h.goals && h.goals.length > 0).slice(0, 5)

  if (habitsWithGoals.length === 0) return null

  return (
    <section className="mb-6">
      <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10">
              <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Active goals</h2>
          </div>
          <Link
            href="/habits"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {habitsWithGoals.map((habit, i) => {
            const colors = GOAL_COLORS[i % GOAL_COLORS.length]
            const goal = habit.goals?.[0]
            const pct = habit.completionRate30d
            const isClaimable = habit.claimableGoalIds && habit.claimableGoalIds.length > 0

            return (
              <div key={habit.id} className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 shrink-0 rounded-sm ${colors.dot}`} />
                <p className="flex-1 text-sm font-medium text-foreground truncate">
                  {goal?.description || habit.name}
                </p>
                {isClaimable && (
                  <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Claimable
                  </span>
                )}
                <div className="w-28 shrink-0">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${colors.bar} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
