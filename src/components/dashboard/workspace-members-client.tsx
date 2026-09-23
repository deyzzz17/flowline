'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  Loader2,
  Check,
  Pencil,
  X,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { api } from '@/api'
import { useSession } from '@/lib/auth-client'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'
import type { WorkspaceInviteRole, WorkspaceMember } from '@/api/workspaces/actions'
import { LIMIT_ERRORS, SAFETY_CAP_ERRORS, type LimitError, type SafetyCapError } from '@/lib/plan-limits'
import { PlanLimitDialog } from '@/components/ui/plan-limit-dialog'
import { SafetyCapDialog } from '@/components/ui/safety-cap-dialog'
import { useCustomRoles, CUSTOM_ROLES_QUERY_KEY } from '@/hooks/workspace/use-custom-roles'
import { WorkspaceRolePermissionsFields } from './workspace-role-permissions-fields'
import type { CustomRoleInput } from '@/api/custom-roles/actions'

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
      {(['admin', 'member', 'viewer'] as WorkspaceInviteRole[]).map((r) => (
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
          {r === 'admin' ? 'Admin' : r === 'member' ? 'Editor' : 'Viewer'}
        </button>
      ))}
    </div>
  )
}

// Either a plain Better Auth base role, or a custom role referenced as
// `custom:<id>` — the base tier that custom role actually maps to is
// resolved server-side (see updateWorkspaceMemberRole), so the client only
// needs to carry the id around.
type RoleSelection = WorkspaceInviteRole | `custom:${string}`

function roleSelectionFromMember(m: WorkspaceMember): RoleSelection {
  if (m.customRoleId) return `custom:${m.customRoleId}`
  return m.role === 'admin' ? 'admin' : 'member'
}

function parseRoleSelection(
  selection: RoleSelection,
): { role: WorkspaceInviteRole; customRoleId: string | null } {
  if (selection.startsWith('custom:')) {
    return { role: 'member', customRoleId: selection.slice('custom:'.length) }
  }
  return { role: selection as WorkspaceInviteRole, customRoleId: null }
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: RoleSelection
  onChange: (value: RoleSelection) => void
  disabled?: boolean
}) {
  const { customRoles } = useCustomRoles()
  const label =
    value.startsWith('custom:')
      ? (customRoles.find((r) => `custom:${r.id}` === value)?.name ?? 'Custom role')
      : value === 'admin'
        ? 'Admin'
        : value === 'viewer'
          ? 'Viewer'
          : 'Editor'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted disabled:opacity-50"
        >
          {label}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onChange('admin')} className="text-xs">
          Admin
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('member')} className="text-xs">
          Editor
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('viewer')} className="text-xs">
          Viewer
        </DropdownMenuItem>
        {customRoles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {customRoles.map((r) => (
              <DropdownMenuItem
                key={r.id}
                onClick={() => onChange(`custom:${r.id}`)}
                className="text-xs"
              >
                {r.name}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Editor',
  viewer: 'Viewer',
}

type RoleFilterValue = 'all' | 'owner' | WorkspaceInviteRole
const ROLE_FILTER_OPTIONS: RoleFilterValue[] = ['all', 'owner', 'admin', 'member', 'viewer']
const ROLE_FILTER_LABELS: Record<RoleFilterValue, string> = {
  all: 'All',
  owner: 'Owner',
  admin: 'Admin',
  member: 'Editor',
  viewer: 'Viewer',
}

function RoleFilterControl({
  value,
  onChange,
}: {
  value: RoleFilterValue
  onChange: (v: RoleFilterValue) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5">
      {ROLE_FILTER_OPTIONS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            'rounded-md px-2 py-1 text-[10px] font-medium transition-all',
            value === r
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {ROLE_FILTER_LABELS[r]}
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
  const { data: archivedData } = useQuery({
    queryKey: ['workspace-members', 'archived'],
    queryFn: () => api.workspaces.listArchivedMembers(),
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })
  const archivedMembers = archivedData?.docs ?? []
  const myMember = members.find((m) => m.userId === currentUserId)
  const myRole = myMember?.role ?? null
  const canManage = myRole === 'owner' || myRole === 'admin'
  const canManageTarget = (target: WorkspaceMember) =>
    myRole === 'owner' || (myRole === 'admin' && target.role !== 'owner')
  const canEditName = (target: WorkspaceMember) =>
    target.userId === currentUserId || myRole === 'owner'
  const canEditRole = (target: WorkspaceMember) =>
    canManageTarget(target) && target.userId !== currentUserId
  const canEditRow = (target: WorkspaceMember) => canEditName(target) || canEditRole(target)
  const canRemoveRow = (target: WorkspaceMember) =>
    canManageTarget(target) && target.userId !== currentUserId

  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('all')
  const filteredMembers = roleFilter === 'all' ? members : members.filter((m) => m.role === roleFilter)

  const { customRoles } = useCustomRoles()
  const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null)
  const [newRoleName, setNewRoleName] = useState('')
  const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: CUSTOM_ROLES_QUERY_KEY })

  const createRoleMutation = useMutation({
    mutationFn: (name: string) =>
      api.customRoles.create({
        name,
        canManageWorkspaceSettings: false,
        canManageMembers: false,
        canManageLists: true,
        canManageCalendar: true,
        canManageTeams: false,
        canPermanentlyDeleteTasks: false,
        canDeleteCalendarCategories: false,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error creating role')
        return
      }
      setNewRoleName('')
      invalidateRoles()
    },
    onError: () => toast.error('Error creating role'),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: CustomRoleInput }) =>
      api.customRoles.update(id, input),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error updating role')
        return
      }
      invalidateRoles()
    },
    onError: () => toast.error('Error updating role'),
  })

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => api.customRoles.delete(id),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error deleting role')
        return
      }
      toast.info('Role deleted')
      invalidateRoles()
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    },
    onError: () => toast.error('Error deleting role'),
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [roleDraft, setRoleDraft] = useState<RoleSelection>('member')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<WorkspaceInviteRole>('member')
  const [limitDialog, setLimitDialog] = useState<LimitError | null>(null)
  const [capDialog, setCapDialog] = useState<SafetyCapError | null>(null)

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
        if (result.error === LIMIT_ERRORS.WORKSPACE_MEMBERS_LIMIT) {
          setLimitDialog(LIMIT_ERRORS.WORKSPACE_MEMBERS_LIMIT)
          return
        }
        if (result.error === SAFETY_CAP_ERRORS.WORKSPACE_MEMBERS_CAP) {
          setCapDialog(SAFETY_CAP_ERRORS.WORKSPACE_MEMBERS_CAP)
          return
        }
        toast.error(result.error || 'Error sending invitation')
        return
      }
      toast.info('Invitation sent')
      setInviteEmail('')
    },
    onError: () => toast.error('Error sending invitation'),
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => api.workspaces.removeMember(memberId),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error removing member')
        return
      }
      toast.info('Member removed')
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    },
    onError: () => toast.error('Error removing member'),
  })

  const restoreMutation = useMutation({
    mutationFn: (archiveId: number) => api.workspaces.restoreMember(archiveId),
    onSuccess: (result) => {
      if (!result.ok) {
        if (result.error === LIMIT_ERRORS.WORKSPACE_MEMBERS_LIMIT) {
          setLimitDialog(LIMIT_ERRORS.WORKSPACE_MEMBERS_LIMIT)
          return
        }
        if (result.error === SAFETY_CAP_ERRORS.WORKSPACE_MEMBERS_CAP) {
          setCapDialog(SAFETY_CAP_ERRORS.WORKSPACE_MEMBERS_CAP)
          return
        }
        toast.error(result.error || 'Error restoring member')
        return
      }
      toast.info('Member restored')
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    },
    onError: () => toast.error('Error restoring member'),
  })

  const saveEditMutation = useMutation({
    mutationFn: async (m: WorkspaceMember) => {
      const { role, customRoleId } = parseRoleSelection(roleDraft)
      const results = await Promise.all([
        canEditName(m) ? api.workspaces.updateMemberNickname(m.id, nicknameDraft) : null,
        canEditRole(m) ? api.workspaces.updateMemberRole(m.id, role, customRoleId) : null,
      ])
      return results.filter((r): r is NonNullable<typeof r> => r !== null)
    },
    onSuccess: (results) => {
      const failed = results.find((r) => !r.ok)
      if (failed) {
        toast.error((!failed.ok && failed.error) || 'Error saving changes')
        return
      }
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    },
    onError: () => toast.error('Error saving changes'),
  })

  const startEditing = (m: WorkspaceMember) => {
    setEditingId(m.id)
    setNicknameDraft(m.nickname ?? m.name)
    setRoleDraft(roleSelectionFromMember(m))
  }

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

      {canManage && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-violet-500" />
              <p className="text-sm font-medium text-foreground">Roles</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap a role to see and change what it&apos;s allowed to do.
            </p>
          </div>

          <div className="space-y-1.5">
            {customRoles.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground/60">
                No custom roles yet.
              </p>
            ) : (
              customRoles.map((role) => {
                const isExpanded = expandedRoleId === role.id
                return (
                  <div
                    key={role.id}
                    className="overflow-hidden rounded-xl border border-border/50"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground"
                      >
                        <ChevronRight
                          className={cn(
                            'h-3.5 w-3.5 transition-transform',
                            isExpanded && 'rotate-90',
                          )}
                        />
                      </button>
                      <span className="flex-1 truncate text-sm font-medium text-foreground">
                        {role.name}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this role?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Members using <strong>{role.name}</strong> will fall back to a plain
                              Editor role.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRoleMutation.mutate(role.id)}
                              variant="destructive"
                            >
                              Delete role
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-border/30 bg-muted/20 px-4 py-3">
                        <WorkspaceRolePermissionsFields
                          value={role}
                          onChange={(next) =>
                            updateRoleMutation.mutate({
                              id: role.id,
                              input: { name: role.name, ...next },
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (newRoleName.trim()) createRoleMutation.mutate(newRoleName.trim())
                }
              }}
              placeholder="New role name..."
              className="h-9 text-sm"
            />
            <button
              type="button"
              onClick={() => newRoleName.trim() && createRoleMutation.mutate(newRoleName.trim())}
              disabled={!newRoleName.trim() || createRoleMutation.isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              {createRoleMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Members
            </span>
          </div>
          {members.length > 0 && (
            <RoleFilterControl value={roleFilter} onChange={setRoleFilter} />
          )}
        </div>
        <div className="p-3 sm:p-5">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Users className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No members yet</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Users className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No {ROLE_FILTER_LABELS[roleFilter].toLowerCase()} in this workspace
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredMembers.map((m) => {
                const isEditingThis = editingId === m.id
                const showEdit = canEditRow(m)
                const showRemove = canRemoveRow(m)

                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
                  >
                    <MemberAvatar name={m.name} image={m.image} />

                    {isEditingThis ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          saveEditMutation.mutate(m)
                        }}
                        className="flex flex-1 items-center gap-2"
                      >
                        {canEditName(m) ? (
                          <Input
                            autoFocus
                            value={nicknameDraft}
                            onChange={(e) => setNicknameDraft(e.target.value)}
                            placeholder={m.name}
                            className="h-8 flex-1 text-sm"
                          />
                        ) : (
                          <p className="flex-1 truncate text-sm font-medium text-foreground">
                            {m.nickname || m.name}
                          </p>
                        )}
                        {canEditRole(m) && <RoleSelect value={roleDraft} onChange={setRoleDraft} />}
                        <button
                          type="submit"
                          disabled={saveEditMutation.isPending}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-violet-600 transition-colors hover:bg-violet-500/10 disabled:opacity-50"
                        >
                          {saveEditMutation.isPending ? (
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
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {m.nickname || m.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground/60">{m.email}</p>
                        </div>

                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                          {m.customRoleName ?? ROLE_LABELS[m.role] ?? m.role}
                        </span>

                        {showEdit && (
                          <button
                            type="button"
                            onClick={() => startEditing(m)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {showRemove && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                disabled={removeMutation.isPending}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove this member?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove <strong>{m.nickname || m.name}</strong> from
                                  this workspace. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeMutation.mutate(m.id)}
                                  variant="destructive"
                                  disabled={removeMutation.isPending}
                                >
                                  Remove member
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {canManage && archivedMembers.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Removed members
              </span>
            </div>
          </div>
          <div className="p-3 sm:p-5">
            <p className="mb-3 text-xs text-muted-foreground">
              Removed when a plan downgrade put this workspace over its member limit. Bring them
              back anytime you have room — either by upgrading, or by removing someone else first.
            </p>
            <div className="space-y-1">
              {archivedMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
                >
                  <MemberAvatar name={m.name} image={m.image} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground/60">{m.email}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => restoreMutation.mutate(m.id)}
                    disabled={restoreMutation.isPending}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {restoreMutation.isPending && restoreMutation.variables === m.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <PlanLimitDialog
        open={!!limitDialog}
        onOpenChange={(v) => {
          if (!v) setLimitDialog(null)
        }}
        limitError={limitDialog}
      />
      <SafetyCapDialog
        open={!!capDialog}
        onOpenChange={(v) => {
          if (!v) setCapDialog(null)
        }}
        capError={capDialog}
      />
    </>
  )
}
