import { useManageDisplay } from '@/hooks/header/use-manage-auth'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'

export const DatePicker = ({
  value,
  onChange,
}: {
  value: Date | undefined
  onChange: (d: Date | undefined) => void
}) => {
  const { open, change } = useManageDisplay()
  return (
    <Popover open={open} onOpenChange={change}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center gap-2.5 rounded-xl border border-border/60 bg-background px-3 text-sm transition-all hover:bg-muted',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left">{value ? format(value, 'PPP') : 'Pick a date'}</span>
          {value && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
              }}
              className="text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={change}
          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
