'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { ContactProfile } from '@/api/contacts/actions'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

interface AssigneePickerProps {
  members: ContactProfile[]
  value: string[]
  onToggle: (userId: string) => void
}

export function AssigneePicker({ members, value, onToggle }: AssigneePickerProps) {
  if (members.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {members.map((m) => {
        const selected = value.includes(m.id)
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onToggle(m.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border pl-1 pr-2.5 py-1 text-xs font-medium transition-all',
              selected
                ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                : 'border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Avatar className="h-4 w-4 shrink-0">
              <AvatarImage src={m.image ?? undefined} alt={m.name} />
              <AvatarFallback className="bg-violet-500/10 text-[8px] font-semibold text-violet-600 dark:text-violet-400">
                {getInitials(m.name)}
              </AvatarFallback>
            </Avatar>
            {m.name}
          </button>
        )
      })}
    </div>
  )
}
