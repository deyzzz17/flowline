'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { cn } from '@/lib/utils'
import { ListFilter } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TAG_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'health', label: 'Health' },
  { value: 'finance', label: 'Finance' },
  { value: 'learning', label: 'Learning' },
] as const

interface TagFilterControlProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function TagFilterControl({ value, onChange }: TagFilterControlProps) {
  const { data: userTagsData } = useQuery({
    queryKey: ['user-tags'],
    queryFn: () => api.tags.tags(),
  })
  const userTags = userTagsData?.docs ?? []

  const toggle = (tag: string) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag])
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
            value.length > 0
              ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
              : 'border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <ListFilter className="h-3.5 w-3.5" />
          Select{value.length > 0 ? ` (${value.length})` : ''}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {TAG_OPTIONS.map((tag) => (
          <DropdownMenuCheckboxItem
            key={tag.value}
            checked={value.includes(tag.value)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggle(tag.value)}
            className="text-xs"
          >
            {tag.label}
          </DropdownMenuCheckboxItem>
        ))}
        {userTags.map((tag) => (
          <DropdownMenuCheckboxItem
            key={tag.id}
            checked={value.includes(String(tag.id))}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggle(String(tag.id))}
            className="text-xs"
          >
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
