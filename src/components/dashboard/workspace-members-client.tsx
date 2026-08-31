'use client'

import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { api } from '@/api'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

export function WorkspaceMembersClient() {
  const { data } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: () => api.workspaces.listMembers(),
  })

  const members = data?.docs ?? []

  return (
    <>
      <section className="mb-8 mt-10">
        <p className="mb-1 text-xl font-semibold uppercase text-violet-500 dark:text-violet-400">
          Workspace
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Members</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 ? 's' : ''} in this workspace.
        </p>
      </section>

      <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Members
            </span>
          </div>
        </div>
        <div className="p-3 sm:p-5">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Users className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No members yet</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Inviting people to a workspace isn&apos;t available yet.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={m.image ?? undefined} alt={m.name} />
                    <AvatarFallback className="bg-violet-500/10 text-xs font-semibold text-violet-600 dark:text-violet-400">
                      {getInitials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground/60">{m.email}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
