'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ContactProfile } from '@/api/contacts/actions'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

interface AssigneeBadgesProps {
  assignedTo: string[] | null | undefined
  members: ContactProfile[]
  size?: 'sm' | 'xs'
}

export function AssigneeBadges({ assignedTo, members, size = 'sm' }: AssigneeBadgesProps) {
  if (!assignedTo || assignedTo.length === 0) return null

  const profiles = assignedTo
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is ContactProfile => m !== undefined)

  if (profiles.length === 0) return null

  const dims = size === 'xs' ? 'h-4 w-4' : 'h-5 w-5'
  const textSize = size === 'xs' ? 'text-[7px]' : 'text-[8px]'

  return (
    <div className="flex items-center -space-x-1.5" title={profiles.map((p) => p.name).join(', ')}>
      {profiles.map((p) => (
        <Avatar key={p.id} className={`${dims} shrink-0 ring-2 ring-background`}>
          <AvatarImage src={p.image ?? undefined} alt={p.name} />
          <AvatarFallback
            className={`bg-violet-500/15 ${textSize} font-semibold text-violet-600 dark:text-violet-400`}
          >
            {getInitials(p.name)}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}
