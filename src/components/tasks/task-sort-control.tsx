'use client'

import { ArrowUpDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { TaskSortBy } from '@/lib/task-sort'

const OPTIONS: { value: TaskSortBy; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'tag', label: 'Tag' },
]

interface TaskSortControlProps {
  value: TaskSortBy
  onChange: (value: TaskSortBy) => void
}

export function TaskSortControl({ value, onChange }: TaskSortControlProps) {
  const currentLabel = OPTIONS.find((o) => o.value === value)?.label ?? 'Sort'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {currentLabel}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn('gap-2 text-xs cursor-pointer', value === option.value && 'font-medium')}
          >
            <Check
              className={cn(
                'h-3 w-3 shrink-0',
                value === option.value ? 'opacity-100' : 'opacity-0',
              )}
            />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
