'use client'

import { ChevronDown, UsersRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface TeamOption {
  id: number
  name: string
}

interface TeamSelectProps {
  teams: TeamOption[]
  value: number | null
  onChange: (id: number | null) => void
  /** Label for the "no team" option — defaults to describing workspace-wide visibility. */
  noTeamLabel?: string
  className?: string
}

// A dropdown for picking which team (if any) a list/category/event should be
// scoped to — used wherever a form lets you associate something with a team,
// instead of a bare <select>.
export function TeamSelect({
  teams,
  value,
  onChange,
  noTeamLabel = 'Whole workspace',
  className,
}: TeamSelectProps) {
  const selected = teams.find((t) => t.id === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 text-foreground transition-colors hover:bg-muted',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{selected ? selected.name : noTeamLabel}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => onChange(null)} className="text-xs">
          {noTeamLabel}
        </DropdownMenuItem>
        {teams.map((t) => (
          <DropdownMenuItem key={t.id} onClick={() => onChange(t.id)} className="text-xs">
            {t.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
