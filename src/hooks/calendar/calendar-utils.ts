import type { RecurrenceRule, SeriesAdjustment } from '@/api/calendar/actions'

export type CalendarView = 'year' | 'month' | 'week' | 'day'

export interface CalendarEvent {
  id: number | string
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay: boolean
  color: string
  categoryId?: number | null
  teamId?: number | null
  /** userIds this event is assigned to (Workspace Calendar only). */
  assignedTo?: string[]
  /** Teams a scheduled meeting is linked to (besides the single `teamId`). */
  teamIds?: number[]
  /** Availability status in the meeting scheduler (Workspace Calendar only). */
  showAs?: 'free' | 'tentative' | 'busy' | 'away'
  recurrence?: RecurrenceRule | null
  recurrenceId?: number | null
  originalDate?: string | null
  isOccurrence?: boolean
  occurrenceDate?: string
  optimisticKey?: string
  source?: 'flowline' | 'google'
  googleCalendarId?: string | null
  googleCalendarName?: string | null
  googleEventId?: string | null
  activeAdjustment?: SeriesAdjustment | null
  type: 'event'
}

export interface CalendarTask {
  id: number
  title: string
  dueDate: string
  listName: string
  listColor: string
  listSlug: string
  /** Length shown in the calendar, in minutes (set by resizing the task). */
  estimatedDuration: number | null
  type: 'task'
}

export type CalendarItem = CalendarEvent | CalendarTask

export const SLOT_HEIGHT = 56
export const MIN_DURATION_MIN = 15
export const DEFAULT_TASK_DURATION_MIN = 30

/**
 * A task never spans two days in the calendar: its length is capped so it
 * ends at the latest at midnight after its due date (local time).
 */
export function capTaskDurationAtMidnight(dueDate: string | Date, minutes: number): number {
  const start = new Date(dueDate)
  const midnight = new Date(start)
  midnight.setHours(24, 0, 0, 0)
  const untilMidnight = Math.round((midnight.getTime() - start.getTime()) / 60000)
  return Math.max(1, Math.min(minutes, untilMidnight))
}
export const VALID_VIEWS: CalendarView[] = ['year', 'month', 'week', 'day']

export function minutesToPx(minutes: number) {
  return (minutes / 60) * SLOT_HEIGHT
}

export function getLocalDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getViewRange(date: Date, view: CalendarView): { from: Date; to: Date } {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  switch (view) {
    case 'year': {
      const from = new Date(y, 0, 1)
      from.setHours(0, 0, 0, 0)
      const to = new Date(y, 11, 31)
      to.setHours(23, 59, 59)
      return { from, to }
    }
    case 'month': {
      const from = new Date(y, m, 1)
      from.setDate(from.getDate() - from.getDay())
      const to = new Date(y, m + 1, 0)
      to.setDate(to.getDate() + (6 - to.getDay()))
      to.setHours(23, 59, 59)
      return { from, to }
    }
    case 'week': {
      const from = new Date(y, m, d - date.getDay() - 2)
      from.setHours(0, 0, 0)
      const to = new Date(y, m, d - date.getDay() + 7)
      to.setHours(23, 59, 59)
      return { from, to }
    }
    case 'day':
      return {
        from: new Date(y, m, d - 1, 0, 0, 0),
        to: new Date(y, m, d, 23, 59, 59),
      }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapEvent(e: any) {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? undefined,
    startDate: e.startDate,
    endDate: e.endDate,
    allDay: e.allDay ?? false,
    color: e.color ?? '#8b5cf6',
    categoryId: typeof e.categoryId === 'number' ? e.categoryId : null,
    teamId: typeof e.team === 'object' ? (e.team?.id ?? null) : (e.team ?? null),
    assignedTo: Array.isArray(e.assignedTo) ? (e.assignedTo as string[]) : [],
    teamIds: Array.isArray(e.teams)
      ? (e.teams as unknown[])
          .map((t) => (t && typeof t === 'object' ? (t as { id: number }).id : t))
          .filter((id): id is number => typeof id === 'number')
      : [],
    showAs: (e.showAs ?? 'busy') as 'free' | 'tentative' | 'busy' | 'away',
    recurrence: e.recurrence?.frequency ? (e.recurrence as RecurrenceRule) : null,
    recurrenceId: e.recurrenceId ?? null,
    originalDate: e.originalDate ?? null,
    exceptions: (e.exceptions ?? []) as { date: string }[],
    adjustments: (e.adjustments ?? []) as SeriesAdjustment[],
    source: (e.source ?? 'flowline') as 'flowline' | 'google',
    googleCalendarId: e.googleCalendarId ?? null,
    googleCalendarName: e.googleCalendarName ?? null,
    googleEventId: e.googleEventId ?? null,
    type: 'event' as const,
  }
}

export function parseViewFromUrl(raw: string | null): CalendarView {
  if (raw && VALID_VIEWS.includes(raw as CalendarView)) return raw as CalendarView
  return 'month'
}

export function parseDateFromUrl(raw: string | null): Date {
  if (!raw) return new Date()
  const parts = raw.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return new Date()
  const [year, month, day] = parts
  const d = new Date(year, month - 1, day, 12, 0, 0)
  return isNaN(d.getTime()) ? new Date() : d
}

export function formatDateForUrl(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export interface ParentOverride {
  startDate?: string
  endDate?: string
  adjustments?: SeriesAdjustment[]
  exceptions?: { date: string }[]
}
