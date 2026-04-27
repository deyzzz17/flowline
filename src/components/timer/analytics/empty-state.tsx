'use client'

import { BarChart2 } from 'lucide-react'

interface EmptyStateProps {
  message?: string
}

export function EmptyState({
  message = 'Not enough data yet. Complete a few sessions to see insights.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
        <BarChart2 className="h-4 w-4 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">No data yet</p>
      <p className="text-xs text-muted-foreground/60 max-w-50">{message}</p>
    </div>
  )
}
