import type { RecurrenceRule } from './actions'

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7)
}
function addMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}
function addYears(date: Date, n: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + n)
  return d
}
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1)
  const firstWeekday = first.getDay()
  const day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7
  return new Date(year, month, day)
}

export function generateOccurrences(
  event: { startDate: string; endDate: string; recurrence?: RecurrenceRule | null },
  from: Date,
  to: Date,
  exceptions: Set<string> = new Set(),
): { date: Date; endDate: Date }[] {
  const rule = event.recurrence
  if (!rule?.frequency) return []

  const duration = new Date(event.endDate).getTime() - new Date(event.startDate).getTime()
  const occurrences: { date: Date; endDate: Date }[] = []
  let current = new Date(event.startDate)
  let count = 0
  const MAX = 3000

  const startDate = new Date(event.startDate)
  const startWeekday = startDate.getDay()
  const startDayOfMonth = startDate.getDate()
  const nthWeekday = Math.ceil(startDayOfMonth / 7)
  const interval = rule.interval ?? 1

  let i = 0
  while (i < MAX) {
    i++

    if (rule.endType === 'onDate' && rule.endDate && current > new Date(rule.endDate)) break
    if (rule.endType === 'afterCount' && rule.endCount != null && count >= rule.endCount) break

    const dateKey = current.toISOString().slice(0, 10)
    const inRange = current >= from && current <= to

    if (inRange && !exceptions.has(dateKey)) {
      occurrences.push({ date: new Date(current), endDate: new Date(current.getTime() + duration) })
    }

    count++

    switch (rule.frequency) {
      case 'daily':
        current = addDays(current, interval)
        break

      case 'weekly': {
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          let safety = 0
          do {
            current = addDays(current, 1)
            if (current.getDay() === 0 && interval > 1) {
              current = addDays(current, (interval - 1) * 7)
            }
            if (++safety > 7 * interval + 7) break
          } while (!rule.daysOfWeek.includes(String(current.getDay()) as any))
        } else {
          current = addWeeks(current, interval)
        }
        break
      }

      case 'monthly': {
        if (rule.monthlyType === 'dayOfWeek') {
          const next = addMonths(current, interval)
          current = nthWeekdayOfMonth(next.getFullYear(), next.getMonth(), startWeekday, nthWeekday)
        } else {
          current = addMonths(current, interval)
        }
        break
      }

      case 'yearly':
        current = addYears(current, interval)
        break
    }

    if (current > to && occurrences.length > 0) break
    if (current > addYears(to, 2)) break
  }

  return occurrences
}
