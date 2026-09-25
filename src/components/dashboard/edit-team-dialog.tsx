'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { api } from '@/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { TeamRolesEditor } from './team-roles-editor'
import { TEAMS_QUERY_KEY } from '@/hooks/teams/use-teams'
import type { TeamOverview } from '@/api/teams/actions'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

interface EditTeamDialogProps {
  teamId: number
  /** Shown immediately while the dialog's own fetch is in flight. */
  teamName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Reachable both from the sidebar's "..." menu on a team, and from the
// pencil icon on the team's own page — one form covering renaming the team,
// managing its roles, and adding/removing members (not, for now, changing
// an existing member's role — that stays on the team page's Members tab).
export function EditTeamDialog({ teamId, teamName, open, onOpenChange }: EditTeamDialogProps) {
  const queryClient = useQueryClient()
  const overviewKey = ['teams', teamId, 'overview']
  const rolesKey = ['teams', teamId, 'roles']

  const { data: overview } = useQuery({
    queryKey: overviewKey,
    queryFn: () => api.teams.getOverview(teamId),
    enabled: open,
  })
  const currentName = overview?.name ?? teamName
  const canManageSettings = overview?.myPermissions.canManageTeamSettings ?? false
  const canManageMembers = overview?.myPermissions.canManageMembers ?? false
  const members = overview?.members ?? []

  const { data: rolesData } = useQuery({
    queryKey: rolesKey,
    queryFn: () => api.teams.listRoles(teamId),
    enabled: open,
  })
  const roles = rolesData ?? []

  const { data: workspaceMembersData } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: () => api.workspaces.listMembers(),
    enabled: open && canManageMembers,
  })
  const candidateMembers = (workspaceMembersData?.docs ?? []).filter(
    (m) => !members.some((tm) => tm.userId === m.userId),
  )

  const [nameDraft, setNameDraft] = useState(teamName)
  useEffect(() => {
    if (open) setNameDraft(currentName)
  }, [open, currentName])

  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [memberError, setMemberError] = useState<string | null>(null)

  const renameMutation = useMutation({
    mutationFn: (name: string) => api.teams.rename(teamId, name),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error renaming team')
        return
      }
      queryClient.invalidateQueries({ queryKey: overviewKey })
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
    },
    onError: () => toast.error('Error renaming team'),
  })

  const addMemberMutation = useMutation({
    mutationFn: () => api.teams.addMember(teamId, selectedUserId, Number(selectedRoleId)),
    onSuccess: (result) => {
      if (!result.ok) {
        setMemberError(result.error)
        return
      }
      setMemberError(null)
      setSelectedUserId('')
      setSelectedRoleId('')
      queryClient.invalidateQueries({ queryKey: overviewKey })
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
    },
    onError: () => setMemberError('Something went wrong. Please try again.'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => api.teams.removeMember(memberId),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error removing member')
        return
      }
      toast.info('Member removed')
      queryClient.invalidateQueries({ queryKey: overviewKey })
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY })
    },
    onError: () => toast.error('Error removing member'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
          <DialogDescription>Rename the team, manage its roles and members.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const trimmed = nameDraft.trim()
              if (trimmed && trimmed !== currentName) renameMutation.mutate(trimmed)
            }}
            className="space-y-2"
          >
            <Label htmlFor="edit-team-name">Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-team-name"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                disabled={!canManageSettings}
                className="h-10 flex-1"
              />
              {canManageSettings && (
                <button
                  type="submit"
                  disabled={
                    renameMutation.isPending ||
                    !nameDraft.trim() ||
                    nameDraft.trim() === currentName
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                >
                  {renameMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {!canManageSettings && (
              <p className="text-[11px] text-muted-foreground/60">
                You don&apos;t have permission to rename this team.
              </p>
            )}
          </form>

          <TeamRolesEditor teamId={teamId} canManage={canManageMembers} />

          <div className="space-y-3">
            <div>
              <Label>Members</Label>
              <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                Add or remove members here. To change someone&apos;s role, use the team&apos;s
                Members tab.
              </p>
            </div>

            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/50 p-1.5">
              {members.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground/60">
                  No members yet.
                </p>
              ) : (
                members.map((m: TeamOverview['members'][number]) => (
                  <div key={m.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={m.image ?? undefined} alt={m.name} />
                      <AvatarFallback className="bg-violet-500/10 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-sm text-foreground">{m.name}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {m.roleName}
                    </span>
                    {canManageMembers && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove this member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              <strong>{m.name}</strong> will be removed from this team. This does
                              not affect their access to the workspace itself.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeMemberMutation.mutate(m.id)}
                              variant="destructive"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))
              )}
            </div>

            {canManageMembers && (
              <div className="space-y-1.5">
                {memberError && <p className="text-xs text-destructive">{memberError}</p>}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="h-9 flex-1 rounded-lg border border-border/60 bg-background px-2 text-xs"
                  >
                    <option value="">
                      {candidateMembers.length === 0 ? 'Everyone is already on the team' : 'Add a member...'}
                    </option>
                    {candidateMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.nickname || m.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="h-9 w-28 shrink-0 rounded-lg border border-border/60 bg-background px-2 text-xs"
                  >
                    <option value="">Role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedUserId) {
                        setMemberError('Pick a member')
                        return
                      }
                      if (!selectedRoleId) {
                        setMemberError('Pick a role')
                        return
                      }
                      setMemberError(null)
                      addMemberMutation.mutate()
                    }}
                    disabled={addMemberMutation.isPending || candidateMembers.length === 0}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    {addMemberMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                {roles.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/60">
                    Create a role above first, then come back here.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
