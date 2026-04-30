import { CheckCircle2, Timer, TrendingUp, Flame } from 'lucide-react'
import { getTimerAnalytics } from '@/api/timer/actions'
import type { Task } from '@/payload-types'

function formatSeconds(s: number): string {
  if (s === 0) return '0m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

interface DashboardStatsProps {
  completedTasks: Task[]
  totalTasks: Task[]
}

export async function DashboardStats({ completedTasks, totalTasks }: DashboardStatsProps) {
  const [todayAnalytics, weekAnalytics] = await Promise.all([
    getTimerAnalytics('day'),
    getTimerAnalytics('week'),
  ])

  const completedToday = completedTasks.length
  const focusToday = todayAnalytics.totalSeconds
  const focusWeek = weekAnalytics.totalSeconds

  const stats = [
    {
      label: 'Tasks completed',
      value: String(completedToday),
      change: `${totalTasks.length} total tasks`,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      trend: completedToday > 0 ? '↑' : null,
    },
    {
      label: 'Active streak',
      value: '—',
      change: 'Coming soon',
      icon: Flame,
      color: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-500/10 dark:bg-orange-500/15',
      trend: null,
    },
    {
      label: 'Focus time',
      value: focusToday > 0 ? formatSeconds(focusToday) : '—',
      change: focusWeek > 0 ? `${formatSeconds(focusWeek)} this week` : 'No sessions yet',
      icon: Timer,
      color: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-500/10 dark:bg-pink-500/15',
      trend: focusToday > 0 ? '↑' : null,
    },
    {
      label: 'Sessions today',
      value: todayAnalytics.totalSessions > 0 ? String(todayAnalytics.totalSessions) : '—',
      change: todayAnalytics.avgSessionSeconds > 0
        ? `Avg ${formatSeconds(todayAnalytics.avgSessionSeconds)}`
        : 'Start a session',
      icon: TrendingUp,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10 dark:bg-violet-500/15',
      trend: todayAnalytics.totalSessions > 0 ? '↑' : null,
    },
  ]

  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              {stat.trend && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {stat.trend}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
            <div className="mt-1 text-xs font-medium text-muted-foreground/60">{stat.change}</div>
          </div>
        ))}
      </div>
    </section>
  )
}