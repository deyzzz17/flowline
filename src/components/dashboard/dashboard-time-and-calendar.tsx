import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { SessionAnalytics } from '@/api/timer-analytics/actions'

interface DashboardTimeAndCalendarProps {
  timerWeek: SessionAnalytics
}

const COLORS = [
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-blue-500',
  'bg-pink-500',
  'bg-amber-500',
]

const COLOR_DOT = [
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-blue-500',
  'bg-pink-500',
  'bg-amber-500',
]

export function DashboardTimeAndCalendar({ timerWeek }: DashboardTimeAndCalendarProps) {
  const { timeByCategory, totalSeconds } = timerWeek

  const top = timeByCategory.slice(0, 4)
  const topWithPct = top.map((c, i) => ({
    ...c,
    pct: totalSeconds > 0 ? Math.round((c.seconds / totalSeconds) * 100) : 0,
    color: COLORS[i % COLORS.length],
    dot: COLOR_DOT[i % COLOR_DOT.length],
  }))

  function formatSeconds(s: number): string {
    if (s === 0) return '0m'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
    return `${m}m`
  }

  const todayEvents = [
    { time: '2:00 PM', title: 'Meeting', color: 'bg-violet-500' },
    { time: '6:00 PM', title: 'Reading', color: 'bg-teal-500' },
    { time: '8:00 PM', title: 'Sport', color: 'bg-orange-500' },
  ]

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Time breakdown — this week</h2>
            {totalSeconds > 0 && (
              <span className="text-xs text-muted-foreground">{formatSeconds(totalSeconds)} total</span>
            )}
          </div>

          {topWithPct.length > 0 ? (
            <>
              <div className="flex h-2 overflow-hidden rounded-full gap-0.5 mb-4">
                {topWithPct.map((c) => (
                  <div
                    key={c.name}
                    className={`h-full rounded-full ${c.color} transition-all duration-700`}
                    style={{ width: `${c.pct}%` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {topWithPct.map((c) => (
                  <div key={c.name} className="flex items-center gap-2.5">
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-sm ${c.dot}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSeconds(c.seconds)} — {c.pct}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">No sessions logged this week yet.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Today</h2>
            <Link
              href="/calendar"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-0 divide-y divide-border/40">
            {todayEvents.map((ev) => (
              <div key={ev.time} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">{ev.time}</span>
                <div className={`h-8 w-0.5 shrink-0 rounded-full ${ev.color}`} />
                <p className="text-sm font-medium text-foreground">{ev.title}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}