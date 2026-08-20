'use client'

import { cn } from '@/lib/utils'
import type { AssigneeFilter } from '@/lib/task-sort'

const OPTIONS: { value: AssigneeFilter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'mine', label: 'Mine' },
  { value: 'others', label: 'Others' },
]

interface AssigneeFilterControlProps {
  value: AssigneeFilter
  onChange: (value: AssigneeFilter) => void
}

export function AssigneeFilterControl({ value, onChange }: AssigneeFilterControlProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
