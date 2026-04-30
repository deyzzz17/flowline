import { Flame, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { DashboardTasks } from '@/components/dashboard/user-tasks'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { DashboardTodayEvents } from '@/components/dashboard/dashboard-today-events'
import { DashboardWeeklyOverview } from '@/components/dashboard/dashboard-weekly-overview'
import { api } from '@/api'
import { ProfileBanner } from '@/components/dashboard/profile-banner'
import { ProtectedRoute } from '@/components/route/protected-route'

const mockHabits = [
  { label: 'Morning workout', pct: 86, color: 'bg-gradient-to-r from-orange-500 to-red-500' },
  { label: 'Read 30 min', pct: 72, color: 'bg-gradient-to-r from-violet-500 to-purple-500' },
  { label: 'Meditate', pct: 94, color: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
]

export default async function DashboardPage() {
  const result = await api.tasks.list()
  const allTasks = result.docs

  const todoTasks = allTasks.filter((t) => t.status === 'active')
  const achievedTasks = allTasks.filter((t) => t.status === 'completed')
  const nonDeletedTasks = allTasks.filter((t) => t.status !== 'deleted')

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-10">
        <section className="mb-5 mt-10">
          <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
            Dashboard
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your workspace today.
          </p>
        </section>

        <ProfileBanner />

        <DashboardStats completedTasks={achievedTasks} totalTasks={nonDeletedTasks} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DashboardTasks
              tasks={todoTasks}
              completedCount={achievedTasks.length}
              totalCount={nonDeletedTasks.length}
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                {
                  label: 'New task',
                  desc: 'Add to your list',
                  href: '/lists',
                  color: 'text-violet-600 dark:text-violet-400',
                  bg: 'bg-violet-500/10',
                },
                {
                  label: 'Calendar',
                  desc: 'View your schedule',
                  href: '/calendar',
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-500/10',
                },
                {
                  label: 'Start timer',
                  desc: 'Focus session',
                  href: '/timer',
                  color: 'text-pink-600 dark:text-pink-400',
                  bg: 'bg-pink-500/10',
                },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm transition-all duration-200 hover:border-border hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${action.bg}`}
                  >
                    <Sparkles className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                  <span className="text-sm font-semibold text-foreground">Habits</span>
                </div>
                <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                  Coming soon
                </span>
              </div>
              <div className="space-y-4 p-5">
                {mockHabits.map((habit) => (
                  <div key={habit.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{habit.label}</span>
                      <span className="text-muted-foreground">{habit.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${habit.color} transition-all duration-1000`}
                        style={{ width: `${habit.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DashboardTodayEvents />

            <DashboardWeeklyOverview />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
