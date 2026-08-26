'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ListMemberRole } from '@/api/list-members/actions'

export function RoleToggle({
  role,
  onChange,
  disabled,
}: {
  role: ListMemberRole
  onChange: (role: ListMemberRole) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5">
      {(['editor', 'reader'] as ListMemberRole[]).map((r) => (
        <button
          key={r}
          type="button"
          disabled={disabled}
          onClick={() => onChange(r)}
          className={cn(
            'rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-all disabled:opacity-50',
            role === r
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

const ROLE_PERMISSIONS: Record<ListMemberRole, string[]> = {
  editor: [
    'View, create, edit, and complete tasks and subtasks',
    'Comment on tasks (Plus/Pro) and react to comments',
    'Cannot invite/remove members or permanently delete tasks',
  ],
  reader: [
    'View all tasks and subtasks, and mark them as complete',
    'React to comments (like/dislike), but cannot post one',
    'Cannot create, edit, comment on, or permanently delete tasks',
  ],
}

export function RolePermissionsHint({ role, className }: { role: ListMemberRole; className?: string }) {
  return (
    <ul className={cn('space-y-0.5 text-[11px] text-muted-foreground/80', className)}>
      {ROLE_PERMISSIONS[role].map((line) => (
        <li key={line} className="flex items-start gap-1.5">
          <Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-violet-500/70" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  )
}
