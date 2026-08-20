'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { cn } from '@/lib/utils'

const TAG_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'health', label: 'Health' },
  { value: 'finance', label: 'Finance' },
  { value: 'learning', label: 'Learning' },
] as const

function hexToRgba(hex: string, alpha: number) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(139,92,246,${alpha})`
  }
}

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
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-border/60 bg-muted/20 p-2">
      {TAG_OPTIONS.map((tag) => (
        <button
          key={tag.value}
          type="button"
          onClick={() => toggle(tag.value)}
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
            value.includes(tag.value)
              ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
              : 'border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {tag.label}
        </button>
      ))}
      {userTags.map((tag) => {
        const isSelected = value.includes(String(tag.id))
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(String(tag.id))}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
              !isSelected && 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
            )}
            style={
              isSelected
                ? {
                    backgroundColor: hexToRgba(tag.color, 0.15),
                    borderColor: hexToRgba(tag.color, 0.5),
                    color: tag.color,
                  }
                : undefined
            }
          >
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
          </button>
        )
      })}
      {value.length === 0 && (
        <span className="px-1 text-xs text-muted-foreground/50">
          Select one or more tags to only show matching tasks.
        </span>
      )}
    </div>
  )
}
