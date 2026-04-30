import { CalendarDays, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { listCalendarEvents } from '@/api/calendar/actions'

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export async function DashboardTodayEvents() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

  let events: { title: string; time: string; color: string }[] = []

  try {
    const result = await listCalendarEvents(startOfDay, endOfDay)
    events = (result.docs ?? [])
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5)
      .map((e) => ({
        title: e.title,
        time: e.allDay ? 'All day' : formatTime(e.startDate),
        color: e.color ?? '#8b5cf6',
      }))
  } catch {
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          <span className="text-sm font-semibold text-foreground">Today</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-xs text-muted-foreground/60">No events today</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {events.map((event, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
            >
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: event.color }}
              />
              <span className="flex-1 truncate text-sm text-foreground">{event.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{event.time}</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-3">
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-xs font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400"
        >
          Open calendar <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}