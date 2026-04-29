'use client'

import { BarChart2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ChartType = 'bar' | 'line'

interface ChartTypeToggleProps {
  value: ChartType
  onChange: (v: ChartType) => void
}

export function ChartTypeToggle({ value, onChange }: ChartTypeToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5">
      <button
        type="button"
        onClick={() => onChange('bar')}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150',
          value === 'bar'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        aria-label="Bar chart"
      >
        <BarChart2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange('line')}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150',
          value === 'line'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        aria-label="Line chart"
      >
        <TrendingUp className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}