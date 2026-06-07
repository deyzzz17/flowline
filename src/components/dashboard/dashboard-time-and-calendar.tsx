import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { SessionAnalytics } from '@/api/timer-analytics/actions'
import type { DashboardTodayEvent } from '@/api/dashboard/actions'

interface DashboardTimeAndCalendarProps {
  timerWeek: SessionAnalytics
  todayEvents: DashboardTodayEvent[]
}

const SEGMENT_COLORS = [
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-blue-500',
  'bg-pink-500',
  'bg-amber-500',
]

const EVENT_COLORS = [
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-blue-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
]

function formatSeconds(s: number): string {
  if (s === 0) return '0m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getEventColorClass(hex: string, index: number): string {
  const normalized = hex.toLowerCase().replace(/\s/g, '')
  const map: Record<string, string> = {
    '#8b5cf6': 'bg-violet-500',
    '#7c3aed': 'bg-violet-600',
    '#3b82f6': 'bg-blue-500',
    '#2563eb': 'bg-blue-600',
    '#10b981': 'bg-emerald-500',
    '#059669': 'bg-emerald-600',
    '#f59e0b': 'bg-amber-500',
    '#d97706': 'bg-amber-600',
    '#ef4444': 'bg-red-500',
    '#dc2626': 'bg-red-600',
    '#ec4899': 'bg-pink-500',
    '#db2777': 'bg-pink-600',
    '#0ea5e9': 'bg-sky-500',
    '#0284c7': 'bg-sky-600',
    '#f97316': 'bg-orange-500',
    '#ea580c': 'bg-orange-600',
    '#14b8a6': 'bg-teal-500',
    '#0d9488': 'bg-teal-600',
    '#84cc16': 'bg-lime-500',
    '#65a30d': 'bg-lime-600',
  }
  return map[normalized] ?? EVENT_COLORS[index % EVENT_COLORS.length]
}

export function DashboardTimeAndCalendar({
  timerWeek,
  todayEvents,
}: DashboardTimeAndCalendarProps) {
  const { timeByCategory, totalSeconds } = timerWeek

  const top = timeByCategory.slice(0, 4)
  const topWithPct = top.map((c, i) => ({
    ...c,
    pct: totalSeconds > 0 ? Math.round((c.seconds / totalSeconds) * 100) : 0,
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
  }))

  const displayedEvents = todayEvents.slice(0, 4)

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Time breakdown — this week</h2>
            {totalSeconds > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatSeconds(totalSeconds)} total
              </span>
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
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-sm ${c.color}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSeconds(c.seconds)} — {c.pct}%
                      </p>
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

          {displayedEvents.length > 0 ? (
            <div className="divide-y divide-border/40">
              {displayedEvents.map((ev, i) => (
                <div key={ev.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                    {ev.allDay ? 'All day' : formatEventTime(ev.startDate)}
                  </span>
                  <div
                    className={`h-8 w-0.5 shrink-0 rounded-full ${getEventColorClass(ev.color, i)}`}
                  />
                  <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                </div>
              ))}
              {todayEvents.length > 4 && (
                <div className="pt-3">
                  <Link
                    href="/calendar"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +{todayEvents.length - 4} more events
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-6">
              <p className="text-sm text-muted-foreground">No events today.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
