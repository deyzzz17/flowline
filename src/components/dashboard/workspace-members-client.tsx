'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, X, Search, Loader2, Check, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { api } from '@/api'
import { useSession } from '@/lib/auth-client'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'
import type { WorkspaceInviteRole, WorkspaceMember } from '@/api/workspaces/actions'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

function MemberAvatar({ name, image }: { name: string; image?: string | null }) {
  return (
    <Avatar className="h-9 w-9 shrink-0">
      <AvatarImage src={image ?? undefined} alt={name} />
      <AvatarFallback className="bg-violet-500/10 text-xs font-semibold text-violet-600 dark:text-violet-400">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

function RoleToggle({
  role,
  onChange,
  disabled,
}: {
  role: WorkspaceInviteRole
  onChange: (role: WorkspaceInviteRole) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5">
      {(['admin', 'member'] as WorkspaceInviteRole[]).map((r) => (
        <button
          key={r}
          type="button"
          disabled={disabled}
          onClick={() => onChange(r)}
          className={cn(
            'rounded-md px-2 py-1 text-[10px] font-medium transition-all disabled:opacity-50',
            role === r
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {r === 'admin' ? 'Admin' : 'Editor'}
        </button>
      ))}
    </div>
  )
}

export function WorkspaceMembersClient() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const { data } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: () => api.workspaces.listMembers(),
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const members = data?.docs ?? []
  const myMember = members.find((m) => m.userId === currentUserId)
  const myRole = myMember?.role ?? null
  const canManage = myRole === 'owner' || myRole === 'admin'
  const canManageTarget = (target: WorkspaceMember) =>
    myRole === 'owner' || (myRole === 'admin' && target.role !== 'owner')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<WorkspaceInviteRole>('member')
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null)

  const isValidInviteEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())
  const { data: inviteSearchResult, isFetching: isSearchingInvite } = useQuery({
    queryKey: ['workspace-invite-search', inviteEmail.trim().toLowerCase()],
    queryFn: () => api.workspaces.searchInvite(inviteEmail.trim()),
    enabled: isValidInviteEmail,
    staleTime: 0,
  })
  const foundInviteUser = inviteSearchResult?.ok ? inviteSearchResult.value : null
  const alreadyAMember =
    foundInviteUser && members.some((m) => m.userId === foundInviteUser.id)

  const inviteMutation = useMutation({
    mutationFn: () => api.workspaces.inviteMember(inviteEmail.trim(), inviteRole),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error sending invitation')
        return
      }
      toast.info('Invitation sent')
      setInviteEmail('')
    },
    onError: () => toast.error('Error sending invitation'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceInviteRole }) =>
      api.workspaces.updateMemberRole(memberId, role),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error updating role')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    },
    onError: () => toast.error('Error updating role'),
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => api.workspaces.removeMember(memberId),
    onSuccess: (result) => {
      setRemoveTarget(null)
      if (!result.ok) {
        toast.error(result.error || 'Error removing member')
        return
      }
      toast.info('Member removed')
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    },
    onError: () => {
      setRemoveTarget(null)
      toast.error('Error removing member')
    },
  })

  const nicknameMutation = useMutation({
    mutationFn: ({ memberId, nickname }: { memberId: string; nickname: string }) =>
      api.workspaces.updateMyNickname(memberId, nickname),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error updating your name')
        return
      }
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    },
    onError: () => toast.error('Error updating your name'),
  })

  const startEditingNickname = (m: WorkspaceMember) => {
    setEditingId(m.id)
    setNicknameDraft(m.nickname ?? '')
  }

  return (
    <>
      <AlertDialog open={!!removeTarget} onOpenChange={(v) => !v && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this member?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeTarget?.nickname || removeTarget?.name}</strong> will lose access to
              this workspace and everything in it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
              disabled={removeMutation.isPending}
              className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="mb-8 mt-10">
        <p className="mb-1 text-xl font-semibold uppercase text-violet-500 dark:text-violet-400">
          Workspace
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Members</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 ? 's' : ''} in this workspace.
        </p>
      </section>

      {canManage && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-violet-500" />
            <p className="text-sm font-medium text-foreground">Add a member</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault()
                }}
                placeholder="Invite by email..."
                className="h-9 pl-9 text-sm"
                type="email"
              />
            </div>
            <RoleToggle role={inviteRole} onChange={setInviteRole} />
          </div>

          {isValidInviteEmail && inviteEmail.trim().length > 0 && (
            <div className="rounded-xl border border-border/50 px-2 py-1.5">
              {isSearchingInvite ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
                </div>
              ) : foundInviteUser ? (
                <div className="flex items-center gap-2.5">
                  <MemberAvatar name={foundInviteUser.name} image={foundInviteUser.image} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {foundInviteUser.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground/60">
                      {foundInviteUser.email}
                    </p>
                  </div>
                  {alreadyAMember ? (
                    <span className="text-xs text-muted-foreground/60">Already a member</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => inviteMutation.mutate()}
                      disabled={inviteMutation.isPending}
                      className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                    >
                      {inviteMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserPlus className="h-3 w-3" />
                      )}
                      Invite
                    </button>
                  )}
                </div>
              ) : (
                <p className="py-2 text-center text-xs text-muted-foreground/60">
                  No Flowline account found with that email.
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
            </div>
          ) : (
            <div className="space-y-1">
              {members.map((m) => {
                const isSelf = m.userId === currentUserId
                const isEditingThis = editingId === m.id
                const manageable = canManageTarget(m) && !isSelf

                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
                  >
                    <MemberAvatar name={m.name} image={m.image} />
                    <div className="min-w-0 flex-1">
                      {isEditingThis ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            nicknameMutation.mutate({ memberId: m.id, nickname: nicknameDraft })
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <Input
                            autoFocus
                            value={nicknameDraft}
                            onChange={(e) => setNicknameDraft(e.target.value)}
                            placeholder={m.name}
                            className="h-7 text-sm"
                          />
                          <button
                            type="submit"
                            disabled={nicknameMutation.isPending}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-violet-600 transition-colors hover:bg-violet-500/10 disabled:opacity-50"
                          >
                            {nicknameMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-foreground">
                            {m.nickname || m.name}
                          </p>
                          {isSelf && (
                            <button
                              type="button"
                              onClick={() => startEditingNickname(m)}
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground"
                              title="Edit your name in this workspace"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                      <p className="truncate text-xs text-muted-foreground/60">{m.email}</p>
                    </div>

                    {manageable ? (
                      <>
                        <RoleToggle
                          role={m.role === 'admin' ? 'admin' : 'member'}
                          disabled={roleMutation.isPending}
                          onChange={(role) => roleMutation.mutate({ memberId: m.id, role })}
                        />
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(m)}
                          disabled={removeMutation.isPending}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                        {m.role === 'owner' ? 'Owner' : m.role === 'admin' ? 'Admin' : 'Editor'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
