import Link from 'next/link'
import { Flame, Trophy, ArrowRight } from 'lucide-react'
import type { HabitWithStats } from '@/api/habits/actions'

interface DashboardStreaksProps {
  habits: HabitWithStats[]
}

export function DashboardStreaks({ habits }: DashboardStreaksProps) {
  const streaks = habits
    .filter((h) => h.currentStreak > 0)
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 6)

  if (streaks.length === 0) return null

  return (
    <section className="mb-6">
      <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10">
              <Flame className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Streaks</h2>
          </div>
          <Link
            href="/habits"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {streaks.map((habit) => {
            const atBest = habit.currentStreak >= habit.longestStreak

            return (
              <div
                key={habit.id}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: habit.color }}
                />
                <span className="max-w-[110px] truncate text-sm font-medium text-foreground">
                  {habit.name}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-orange-500 dark:text-orange-400">
                  <Flame className="h-3.5 w-3.5" />
                  {habit.currentStreak}
                </span>
                {atBest ? (
                  <Trophy
                    className="h-3.5 w-3.5 shrink-0 text-amber-500"
                    aria-label="Personal best"
                  />
                ) : (
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    best {habit.longestStreak}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
