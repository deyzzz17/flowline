'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronRight, Loader2, Plus, X, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/api'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useTeamsAccess, TEAMS_QUERY_KEY } from '@/hooks/teams/use-teams'
import { TeamRolePermissionsFields } from './team-role-permissions-fields'
import type { TeamRoleInput } from '@/api/teams/actions'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

const DEFAULT_ROLE: TeamRoleInput = {
  name: 'Member',
  canManageLists: true,
  canManageCalendar: true,
  canManageMembers: false,
  canManageTeamSettings: false,
}

interface CreateTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { hasAccess, isLoading: accessLoading } = useTeamsAccess(open)

  const [name, setName] = useState('')
  const [roles, setRoles] = useState<TeamRoleInput[]>([DEFAULT_ROLE])
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())
  const [newRoleName, setNewRoleName] = useState('')
  const [selected, setSelected] = useState<Map<string, string>>(new Map())
  const [error, setError] = useState<string | null>(null)

  const { data: workspaceMembersData } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: () => api.workspaces.listMembers(),
    enabled: open && hasAccess,
  })
  const members = workspaceMembersData?.docs ?? []

  const reset = () => {
    setName('')
    setRoles([DEFAULT_ROLE])
    setExpandedRoles(new Set())
    setNewRoleName('')
    setSelected(new Map())
    setError(null)
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const toggleExpanded = (roleName: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(roleName)) next.delete(roleName)
      else next.add(roleName)
      return next
    })
  }

  const addRole = () => {
    const trimmed = newRoleName.trim()
    if (!trimmed || roles.some((r) => r.name === trimmed)) return
    setRoles((prev) => [
      ...prev,
      {
        name: trimmed,
        canManageLists: true,
        canManageCalendar: true,
        canManageMembers: false,
        canManageTeamSettings: false,
      },
    ])
    setNewRoleName('')
  }

  const updateRole = (roleName: string, patch: Partial<TeamRoleInput>) => {
    setRoles((prev) => prev.map((r) => (r.name === roleName ? { ...r, ...patch } : r)))
  }

  const removeRole = (roleName: string) => {
    setRoles((prev) => prev.filter((r) => r.name !== roleName))
    const fallback = roles.find((r) => r.name !== roleName)?.name ?? ''
    setSelected((prev) => {
      const next = new Map(prev)
      for (const [userId, r] of next) if (r === roleName) next.set(userId, fallback)
      return next
    })
  }

  const toggleMember = (userId: string) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(userId)) next.delete(userId)
      else next.set(userId, roles[0]?.name ?? '')
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.teams.create({
        name: name.trim(),
        roles,
        members: [...selected.entries()].map(([userId, roleName]) => ({ userId, roleName })),
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.info('Team created')
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
      handleOpenChange(false)
      router.push(`/teams/${result.value.id}`)
    },
    onError: () => setError('Something went wrong. Please try again.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if ([...selected.values()].some((r) => !r)) {
      setError('Every selected member needs a role')
      return
    }
    setError(null)
    mutation.mutate()
  }

  if (!accessLoading && !hasAccess) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Teams is a Pro feature</DialogTitle>
            <DialogDescription>
              Upgrade to Pro to create unlimited teams in this workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Link
              href="/billing"
              onClick={() => handleOpenChange(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              <Zap className="h-3.5 w-3.5" />
              Upgrade to Pro
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New team</DialogTitle>
          <DialogDescription>Group workspace members and give each one a role.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="team-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design"
              className="h-10"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="space-y-1.5">
              {roles.map((role) => {
                const isExpanded = expandedRoles.has(role.name)
                return (
                  <div key={role.name} className="rounded-xl border border-border/50 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(role.name)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground transition-transform"
                      >
                        <ChevronRight
                          className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')}
                        />
                      </button>
                      <span className="flex-1 truncate text-sm font-medium text-foreground">
                        {role.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRole(role.name)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-border/40 bg-muted/20 px-3 py-3">
                        <TeamRolePermissionsFields
                          value={role}
                          onChange={(next) => updateRole(role.name, next)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addRole()
                  }
                }}
                placeholder="New role name..."
                className="h-9 text-sm"
              />
              <button
                type="button"
                onClick={addRole}
                disabled={!newRoleName.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground/70">
              These roles will only exist in this team — tap a role to choose what it&apos;s
              allowed to do.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Members</Label>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-border/50 p-1.5">
              {members.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground/60">
                  No other members in this workspace yet.
                </p>
              ) : (
                members.map((m) => {
                  const isChecked = selected.has(m.userId)
                  return (
                    <div
                      key={m.userId}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors',
                        isChecked ? 'bg-violet-500/5' : 'hover:bg-muted/40',
                      )}
                    >
                      <Checkbox checked={isChecked} onCheckedChange={() => toggleMember(m.userId)} />
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={m.image ?? undefined} alt={m.nickname || m.name} />
                        <AvatarFallback className="bg-violet-500/10 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                          {getInitials(m.nickname || m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-sm text-foreground">
                        {m.nickname || m.name}
                      </span>
                      {isChecked && (
                        <select
                          value={selected.get(m.userId) ?? ''}
                          onChange={(e) =>
                            setSelected((prev) => new Map(prev).set(m.userId, e.target.value))
                          }
                          className="h-7 rounded-md border border-border/60 bg-background px-1.5 text-xs"
                        >
                          {roles.map((role) => (
                            <option key={role.name} value={role.name}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !name.trim()} className="gap-2">
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Create team
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
