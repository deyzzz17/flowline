import { cn } from '@/lib/utils'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { format, isPast, isToday, isTomorrow } from 'date-fns'
import { AlertCircle } from 'lucide-react'

export const DueDateBadge = ({
  dateString,
  completed,
}: {
  dateString: string
  completed: boolean
}) => {
  const date = new Date(dateString)
  const overdue = !completed && isPast(date) && !isToday(date)
  const dueToday = isToday(date)
  const dueTomorrow = isTomorrow(date)
  const label = dueToday ? 'Today' : dueTomorrow ? 'Tomorrow' : format(date, 'MMM d')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
        overdue
          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
          : dueToday
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            : 'bg-muted text-muted-foreground',
      )}
    >
      {overdue && <AlertCircle className="h-2.5 w-2.5" />}
      <CalendarIcon className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}
