'use client'

import { cn } from '@/lib/utils'

export type TimePeriod = 'day' | 'week' | 'month' | 'year'

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

interface TimePeriodSelectorProps {
  value: TimePeriod
  onChange: (v: TimePeriod) => void
}

export function TimePeriodSelector({ value, onChange }: TimePeriodSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
            value === p.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}