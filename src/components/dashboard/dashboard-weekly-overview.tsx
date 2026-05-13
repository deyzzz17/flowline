import { TrendingUp } from 'lucide-react'
import { getTimerAnalytics } from '@/api/timer-analytics/actions'

export async function DashboardWeeklyOverview() {
  const analytics = await getTimerAnalytics('week')

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const dayOrder = [1, 2, 3, 4, 5, 6, 0]

  const secondsByDay = dayOrder.map((dayIndex) => {
    const point = analytics.timeSeries.find((p) => p.timestamp === dayIndex)
    if (!point) return 0
    return Object.entries(point)
      .filter(([k]) => k.startsWith('cat__'))
      .reduce((sum, [, v]) => sum + (Number(v) || 0), 0)
  })

  const maxSeconds = Math.max(...secondsByDay, 1)

  const totalMinutes = Math.round(analytics.totalSeconds / 60)
  const hasData = analytics.totalSeconds > 0

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">Weekly overview</span>
        </div>
        {hasData && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {totalMinutes >= 60
              ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
              : `${totalMinutes}m`}
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5" style={{ height: 56 }}>
        {secondsByDay.map((secs, i) => {
          const heightPct = maxSeconds > 0 ? (secs / maxSeconds) * 100 : 0
          const isEmpty = secs === 0
          return (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className={`w-full rounded-sm transition-all duration-700 ${
                  isEmpty
                    ? 'bg-muted/50'
                    : 'bg-linear-to-t from-violet-600 to-purple-400 opacity-70 hover:opacity-100'
                }`}
                style={{ height: isEmpty ? '4px' : `${Math.max((heightPct / 100) * 48, 4)}px` }}
                title={secs > 0 ? `${Math.round(secs / 60)}m` : 'No sessions'}
              />
              <span className="text-[9px] text-muted-foreground">{days[i]}</span>
            </div>
          )
        })}
      </div>

      {!hasData && (
        <p className="mt-3 text-center text-[10px] text-muted-foreground/50">
          Start a focus session to see your weekly progress
        </p>
      )}
    </div>
  )
}
