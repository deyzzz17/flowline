'use client'

import { cn } from '@/lib/utils'
import { usePublicHolidays } from '@/hooks/calendar/use-public-holidays'
import type { CalendarItem } from '@/hooks/calendar/use-calendar'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getDaysInMonth(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: (Date | null)[] = []
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

interface MiniMonthProps {
  year: number
  month: number
  today: Date
  getItemsForDate: (date: Date) => CalendarItem[]
  getHoliday: (date: Date) => { localName: string } | null
  onClickDay: (date: Date) => void
  onClickMonth: (date: Date) => void
}

function MiniMonth({
  year,
  month,
  today,
  getItemsForDate,
  getHoliday,
  onClickDay,
  onClickMonth,
}: MiniMonthProps) {
  const days = getDaysInMonth(year, month)
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-3 hover:border-border/60 transition-colors">
      <button
        type="button"
        onClick={() => onClickMonth(new Date(year, month, 1))}
        className={cn(
          'text-xs font-semibold mb-2 w-full text-left transition-colors hover:text-violet-500',
          isCurrentMonth ? 'text-violet-600 dark:text-violet-400' : 'text-foreground',
        )}
      >
        {MONTHS[month]}
      </button>

      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-medium text-muted-foreground/50 py-0.5"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />

          const isToday = date.toDateString() === today.toDateString()
          const holiday = getHoliday(date)
          const items = getItemsForDate(date)
          const hasEvents = items.length > 0
          const eventColors = items
            .slice(0, 3)
            .map((item) =>
              item.type === 'event' ? item.color : ((item as any).listColor ?? '#8b5cf6'),
            )

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onClickDay(date)}
              className={cn(
                'relative flex flex-col items-center rounded-md py-0.5 transition-colors hover:bg-muted/40 group',
                holiday && 'bg-amber-500/10 rounded-md',
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full transition-colors',
                  isToday
                    ? 'bg-violet-600 text-white font-semibold'
                    : holiday
                      ? 'text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-foreground group-hover:bg-muted',
                )}
              >
                {date.getDate()}
              </span>
              <div className="flex gap-0.5 mt-0.5 items-center">
                {holiday && <span className="h-1 w-1 rounded-full bg-amber-500" />}
                {hasEvents &&
                  eventColors.map((color, ci) => (
                    <span
                      key={ci}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface CalendarYearViewProps {
  currentDate: Date
  getItemsForDate: (date: Date) => CalendarItem[]
  onClickDay: (date: Date) => void
  onClickMonth: (date: Date) => void
}

export function CalendarYearView({
  currentDate,
  getItemsForDate,
  onClickDay,
  onClickMonth,
}: CalendarYearViewProps) {
  const year = currentDate.getFullYear()
  const today = new Date()
  const { getHoliday } = usePublicHolidays(year)

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, month) => (
          <MiniMonth
            key={month}
            year={year}
            month={month}
            today={today}
            getItemsForDate={getItemsForDate}
            getHoliday={getHoliday}
            onClickDay={onClickDay}
            onClickMonth={onClickMonth}
          />
        ))}
      </div>
    </div>
  )
}
