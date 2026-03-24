import {
  CheckCircle2,
  Flame,
  Timer,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardTasks } from '@/components/dashboard/user-tasks'
import { api } from '@/api'
import { ProfileBanner } from '@/components/dashboard/profile-banner'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const mockStats = [
  {
    label: 'Tasks completed',
    value: '24',
    change: '+4 this week',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
  },
  {
    label: 'Active streak',
    value: '12',
    change: 'days in a row',
    icon: Flame,
    color: 'text-orange-500 dark:text-orange-400',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
  },
  {
    label: 'Focus time',
    value: '4h 32m',
    change: '+1h vs yesterday',
    icon: Timer,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-500/10 dark:bg-pink-500/15',
  },
  {
    label: 'Productivity',
    value: '87%',
    change: '+5% this week',
    icon: TrendingUp,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
  },
]

const mockHabits = [
  { label: 'Morning workout', pct: 86, color: 'bg-gradient-to-r from-orange-500 to-red-500' },
  { label: 'Read 30 min', pct: 72, color: 'bg-gradient-to-r from-violet-500 to-purple-500' },
  { label: 'Meditate', pct: 94, color: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
]

const mockEvents = [
  { title: 'Sprint Review', time: '10:00', color: 'bg-blue-500' },
  { title: 'Design sync', time: '14:00', color: 'bg-violet-500' },
  { title: 'Team standup', time: '09:00', color: 'bg-emerald-500' },
]

export default async function DashboardPage() {
  const result = await api.tasks.list()
  const allTasks = result.docs

  const todoTasks = allTasks.filter((t) => t.status === 'active')
  const achievedTasks = allTasks.filter((t) => t.status === 'completed')
  const nonDeletedTasks = allTasks.filter((t) => t.status !== 'deleted')

  return (
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

      <section className="mb-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {mockStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ↑
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {stat.change}
              </div>
            </div>
          ))}
        </div>
      </section>

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
                label: 'Track habit',
                desc: 'Log your progress',
                href: '/habits',
                color: 'text-orange-500 dark:text-orange-400',
                bg: 'bg-orange-500/10',
              },
              {
                label: 'Start timer',
                desc: 'Focus session',
                href: '/timers',
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
                12 day streak 🔥
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

          <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-semibold text-foreground">Today</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="divide-y divide-border/30">
              {mockEvents.map((event) => (
                <div
                  key={event.title}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <div className={`h-2 w-2 shrink-0 rounded-full ${event.color}`} />
                  <span className="flex-1 text-sm text-foreground">{event.title}</span>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3">
              <Link
                href="/calendar"
                className="flex items-center gap-1 text-xs font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400"
              >
                Open calendar <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-foreground">Weekly overview</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ↑ 18%
              </span>
            </div>
            <div className="flex items-end gap-1.5" style={{ height: 56 }}>
              {[40, 65, 50, 80, 70, 90, 55].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-sm bg-linear-to-t from-violet-600 to-purple-400 opacity-70 transition-opacity hover:opacity-100"
                    style={{ height: `${(h / 100) * 48}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
