'use client'

import { Users, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const currentLabel = OPTIONS.find((o) => o.value === value)?.label ?? 'Everyone'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <Users className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{currentLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
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
