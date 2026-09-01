'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Briefcase,
  Rocket,
  Sparkles,
  Star,
  Zap,
  Globe,
  Users,
  Folder,
  Layers,
  Target,
  Flag,
  User,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import {
  isPlanUnlimited,
  LIMIT_ERRORS,
  SAFETY_CAP_ERRORS,
  type LimitError,
  type SafetyCapError,
} from '@/lib/plan-limits'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { PlanLimitDialog } from '@/components/ui/plan-limit-dialog'
import { SafetyCapDialog } from '@/components/ui/safety-cap-dialog'
import type { WorkspaceSummary, WorkspaceInviteRole } from '@/api/workspaces/actions'
import type { ContactProfile } from '@/api/contacts/actions'
import { cn } from '@/lib/utils'

// Query keys whose data depends on the active workspace — invalidated (not a
// full page reload) when switching, so the switch feels instant. Exported
// since accepting a workspace invite (use-notifications.ts) also switches
// the active workspace under the hood and needs the same invalidation.
export const WORKSPACE_SCOPED_QUERY_KEYS = [
  'lists',
  'tasks',
  'list-analytics',
  'calendar-categories',
  'workspace-calendar-events',
]

const PRESET_COLORS = [
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#10b981',
  '#84cc16',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#64748b',
]

const WORKSPACE_ICON_NAMES = [
  'Building2',
  'Briefcase',
  'Rocket',
  'Sparkles',
  'Star',
  'Zap',
  'Globe',
  'Users',
  'Folder',
  'Layers',
  'Target',
  'Flag',
] as const

const WORKSPACE_ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Briefcase,
  Rocket,
  Sparkles,
  Star,
  Zap,
  Globe,
  Users,
  Folder,
  Layers,
  Target,
  Flag,
  User,
}

const WORKSPACE_ROLE_DESCRIPTIONS: Record<WorkspaceInviteRole, string> = {
  admin: 'Manage members, workspace and content.',
  member: 'Create and manage workspace content.',
}

function hexToRgba(hex: string, alpha: number) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(139,92,246,${alpha})`
  }
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

function WorkspaceAvatar({
  icon,
  color,
  className,
}: {
  icon?: string
  color?: string
  className?: string
}) {
  const Icon = (icon && WORKSPACE_ICON_MAP[icon]) || Building2
  const c = color || '#8b5cf6'
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-md', className)}
      style={{ backgroundColor: hexToRgba(c, 0.15), color: c }}
    >
      <Icon className="h-4 w-4" />
    </span>
  )
}

export type WorkspacesData = { docs: WorkspaceSummary[]; activeId: string | null }

/** Reads the same `['workspaces']` query cache as the switcher — no extra fetch. */
export function useActiveWorkspace(initialData?: WorkspacesData) {
  const { data } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.workspaces.list(),
    ...(initialData && { initialData }),
  })
  const workspaces = data?.docs ?? []
  const activeId = data?.activeId ?? null
  return workspaces.find((w) => w.id === activeId) ?? null
}

interface StagedInvite {
  user: ContactProfile
  role: WorkspaceInviteRole
}

function useWorkspaceSwitcher(initialData?: WorkspacesData) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const planLimits = usePlanLimits()

  const { data } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.workspaces.list(),
    ...(initialData && { initialData }),
  })

  const workspaces = data?.docs ?? []
  const activeId = data?.activeId ?? null
  const activeWorkspace = workspaces.find((w) => w.id === activeId) ?? workspaces[0]
  const extraCount = workspaces.filter((w) => !w.isPersonal).length

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<string>(WORKSPACE_ICON_NAMES[0])
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [inviteEmail, setInviteEmail] = useState('')
  const [stagedInvites, setStagedInvites] = useState<StagedInvite[]>([])
  const [createError, setCreateError] = useState<string | null>(null)
  const [limitDialog, setLimitDialog] = useState<LimitError | null>(null)
  const [capDialog, setCapDialog] = useState<SafetyCapError | null>(null)

  const [editTarget, setEditTarget] = useState<WorkspaceSummary | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<WorkspaceSummary | null>(null)

  const isValidInviteEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())
  const stagedEmails = new Set(stagedInvites.map((i) => i.user.email.toLowerCase()))

  const { data: inviteSearchResult, isFetching: isSearchingInvite } = useQuery({
    queryKey: ['workspace-invite-search', inviteEmail.trim().toLowerCase()],
    queryFn: () => api.workspaces.searchInvite(inviteEmail.trim()),
    enabled: isValidInviteEmail && createOpen,
    staleTime: 0,
  })

  const switchMutation = useMutation({
    mutationFn: async (id: string | null) => {
      const result = await api.workspaces.switch(id)
      if (result.ok) {
        // The server's active-organization cookie is only correct once this
        // resolves, so Today can only be prefetched (with the RIGHT data)
        // after — not in parallel with — the switch itself. Best-effort: if
        // it fails, Today just fetches normally once we land on it.
        try {
          await queryClient.prefetchQuery({
            queryKey: ['tasks', 'today'],
            queryFn: () => api.tasks.listToday(),
          })
        } catch {}
      }
      return result
    },
    onMutate: async (id) => {
      // Optimistic: flip the active workspace in the cache immediately so the
      // switcher's checkmark/label update the instant you click, instead of
      // waiting on the round trip.
      await queryClient.cancelQueries({ queryKey: ['workspaces'] })
      const previous = queryClient.getQueryData<WorkspacesData>(['workspaces'])
      queryClient.setQueryData<WorkspacesData>(['workspaces'], (old) =>
        old ? { ...old, activeId: id } : old,
      )
      return { previous }
    },
    onSuccess: (result, _id, context) => {
      if (!result.ok) {
        if (context?.previous) queryClient.setQueryData(['workspaces'], context.previous)
        toast.error(result.error || 'Error while switching workspace.')
        return
      }
      // No need to re-fetch ['workspaces'] — the optimistic activeId set in
      // onMutate is already confirmed correct by the mutation succeeding.
      // For the rest, invalidate everything EXCEPT ['tasks', 'today']: that
      // one was just re-fetched with the right data above, so marking it
      // stale again here would only cause a redundant refetch the instant
      // Today mounts.
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [primary, secondary] = query.queryKey
          if (primary === 'tasks' && secondary === 'today') return false
          return WORKSPACE_SCOPED_QUERY_KEYS.includes(primary as string)
        },
      })
      router.push('/lists/today')
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['workspaces'], context.previous)
      toast.error('Error while switching workspace.')
    },
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.workspaces.create({
        name: name.trim(),
        icon,
        color,
        invites: stagedInvites.map((i) => ({ email: i.user.email, role: i.role })),
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        if (result.error === LIMIT_ERRORS.WORKSPACES_LIMIT) {
          setCreateOpen(false)
          setLimitDialog(LIMIT_ERRORS.WORKSPACES_LIMIT)
          return
        }
        if (result.error === SAFETY_CAP_ERRORS.WORKSPACES_CAP) {
          setCreateOpen(false)
          setCapDialog(SAFETY_CAP_ERRORS.WORKSPACES_CAP)
          return
        }
        setCreateError(result.error)
        return
      }
      setCreateOpen(false)
      setName('')
      setStagedInvites([])
      setInviteEmail('')
      setCreateError(null)
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      if (result.value.failedInvites.length > 0) {
        toast.error(
          `Workspace created, but ${result.value.failedInvites.length === 1 ? 'an invite' : 'some invites'} could not be sent`,
          { description: result.value.failedInvites.join(', ') },
        )
      } else if (stagedInvites.length > 0) {
        toast.info(
          `Invitation${stagedInvites.length > 1 ? 's' : ''} sent to ${stagedInvites.length} ${stagedInvites.length === 1 ? 'person' : 'people'}.`,
        )
      }
    },
  })

  const editMutation = useMutation({
    mutationFn: () => {
      if (!editTarget?.id) throw new Error('No workspace selected')
      return api.workspaces.updateName(editTarget.id, editName.trim())
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setEditError(result.error)
        return
      }
      setEditTarget(null)
      setEditError(null)
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: () => setEditError('Error while renaming the workspace'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!deleteTarget?.id) throw new Error('No workspace selected')
      return api.workspaces.delete(deleteTarget.id)
    },
    onSuccess: (result) => {
      setDeleteTarget(null)
      if (!result.ok) {
        toast.error(result.error || 'Error while deleting the workspace')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      if (deleteTarget?.id === activeId) {
        for (const key of WORKSPACE_SCOPED_QUERY_KEYS) {
          queryClient.invalidateQueries({ queryKey: [key] })
        }
        router.push('/lists/today')
      }
    },
    onError: () => {
      setDeleteTarget(null)
      toast.error('Error while deleting the workspace')
    },
  })

  const atLimit = planLimits ? extraCount >= planLimits.limits.workspaces : true

  const handleLockedClick = () => {
    if (planLimits && isPlanUnlimited(planLimits.plan, 'workspaces')) {
      setCapDialog(SAFETY_CAP_ERRORS.WORKSPACES_CAP)
    } else {
      setLimitDialog(LIMIT_ERRORS.WORKSPACES_LIMIT)
    }
  }

  const openCreateDialog = () => {
    setName('')
    setIcon(WORKSPACE_ICON_NAMES[0])
    setColor(PRESET_COLORS[0])
    setInviteEmail('')
    setStagedInvites([])
    setCreateError(null)
    setCreateOpen(true)
  }

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || createMutation.isPending) return
    createMutation.mutate()
  }

  const addStagedInvite = (user: ContactProfile) => {
    if (stagedEmails.has(user.email.toLowerCase())) return
    setStagedInvites((prev) => [...prev, { user, role: 'member' }])
    setInviteEmail('')
  }

  const removeStagedInvite = (userId: string) => {
    setStagedInvites((prev) => prev.filter((i) => i.user.id !== userId))
  }

  const setStagedInviteRole = (userId: string, role: WorkspaceInviteRole) => {
    setStagedInvites((prev) => prev.map((i) => (i.user.id === userId ? { ...i, role } : i)))
  }

  const openEditDialog = (workspace: WorkspaceSummary) => {
    setEditTarget(workspace)
    setEditName(workspace.name)
    setEditError(null)
  }

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim() || editMutation.isPending) return
    editMutation.mutate()
  }

  return {
    workspaces,
    activeId,
    activeWorkspace,
    atLimit,
    switchTo: (id: string | null) => switchMutation.mutate(id),
    // `undefined` means "not switching" — `null` is Personal's real id, so it
    // can't double as the sentinel or Personal would always show as pending.
    switchingId: switchMutation.isPending ? switchMutation.variables : undefined,
    openCreateDialog,
    handleLockedClick,
    createOpen,
    setCreateOpen,
    name,
    setName,
    icon,
    setIcon,
    color,
    setColor,
    inviteEmail,
    setInviteEmail,
    isValidInviteEmail,
    inviteSearchResult: inviteSearchResult?.ok ? inviteSearchResult.value : null,
    isSearchingInvite: isSearchingInvite && isValidInviteEmail,
    stagedInvites,
    stagedEmails,
    addStagedInvite,
    removeStagedInvite,
    setStagedInviteRole,
    createError,
    handleSubmitCreate,
    isCreating: createMutation.isPending,
    limitDialog,
    setLimitDialog,
    capDialog,
    setCapDialog,
    editTarget,
    openEditDialog,
    closeEditDialog: () => setEditTarget(null),
    editName,
    setEditName,
    editError,
    handleSubmitEdit,
    isEditing: editMutation.isPending,
    deleteTarget,
    setDeleteTarget,
    confirmDelete: () => deleteMutation.mutate(),
    isDeleting: deleteMutation.isPending,
  }
}

type WorkspaceSwitcherState = ReturnType<typeof useWorkspaceSwitcher>

function WorkspaceMenuContent({
  align,
  s,
}: {
  align?: 'start' | 'center' | 'end'
  s: WorkspaceSwitcherState
}) {
  return (
    <DropdownMenuContent align={align ?? 'start'} className="w-64">
      <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Workspaces
      </DropdownMenuLabel>
      {s.workspaces.map((w) => (
        <div
          key={w.id ?? 'personal'}
          role="menuitem"
          onClick={() => s.switchingId === undefined && w.id !== s.activeId && s.switchTo(w.id)}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
            s.switchingId !== undefined
              ? 'opacity-60'
              : 'cursor-pointer hover:bg-muted focus:bg-muted',
          )}
        >
          <WorkspaceAvatar icon={w.icon} color={w.color} className="size-6" />
          <span className="flex-1 truncate">{w.name}</span>
          {s.switchingId === w.id ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            w.id === s.activeId && <Check className="h-3.5 w-3.5 shrink-0 text-violet-500" />
          )}
          {!w.isPersonal && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-background hover:text-foreground"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-36">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    s.openEditDialog(w)
                  }}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    s.setDeleteTarget(w)
                  }}
                  className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
      <DropdownMenuSeparator />
      {s.atLimit ? (
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground/50">
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">Create new workspace</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              s.handleLockedClick()
            }}
            className="shrink-0 text-violet-500/70 transition-colors hover:text-violet-500"
            title="Upgrade to create more workspaces"
          >
            <Zap className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <DropdownMenuItem onClick={s.openCreateDialog} className="gap-2.5 text-sm cursor-pointer">
          <Plus className="h-3.5 w-3.5 shrink-0" />
          Create new workspace
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  )
}

function WorkspaceRoleToggle({
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

function InviteRowAvatar({ name, image }: { name: string; image?: string | null }) {
  return (
    <Avatar className="h-8 w-8 shrink-0">
      <AvatarImage src={image ?? undefined} alt={name} />
      <AvatarFallback className="bg-violet-500/10 text-xs font-semibold text-violet-600 dark:text-violet-400">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

function CreateWorkspaceDialog({ s }: { s: WorkspaceSwitcherState }) {
  const showSearchResult = s.isValidInviteEmail && s.inviteEmail.trim().length > 0
  const alreadyStaged =
    s.inviteSearchResult && s.stagedEmails.has(s.inviteSearchResult.email.toLowerCase())

  return (
    <Dialog open={s.createOpen} onOpenChange={s.setCreateOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={s.handleSubmitCreate} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace-name" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="workspace-name"
              autoFocus
              value={s.name}
              onChange={(e) => s.setName(e.target.value)}
              placeholder="Workspace name..."
              className="h-11"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Icon</Label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_ICON_NAMES.map((iconName) => {
                const Icon = WORKSPACE_ICON_MAP[iconName]
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => s.setIcon(iconName)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl border transition-all',
                      s.icon === iconName
                        ? 'border-transparent scale-105'
                        : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground',
                    )}
                    style={
                      s.icon === iconName
                        ? { backgroundColor: hexToRgba(s.color, 0.15), color: s.color }
                        : undefined
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => s.setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    s.color === c ? 'scale-110' : 'hover:scale-105',
                  )}
                  style={{
                    backgroundColor: c,
                    ...(s.color === c && { outline: `3px solid ${c}`, outlineOffset: '2px' }),
                  }}
                />
              ))}
            </div>
            <div
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium"
              style={{
                backgroundColor: hexToRgba(s.color, 0.1),
                borderColor: hexToRgba(s.color, 0.3),
                color: s.color,
              }}
            >
              <WorkspaceAvatar icon={s.icon} color={s.color} className="size-5" />
              {s.name || 'Preview'}
            </div>
          </div>

          {s.createError && <p className="text-xs text-destructive">{s.createError}</p>}

          <div className="space-y-3 rounded-2xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              <p className="text-sm font-medium text-foreground">Invite members</p>
              <span className="text-xs font-normal text-muted-foreground">Optional</span>
            </div>

            {s.stagedInvites.length > 0 && (
              <div className="space-y-2">
                {s.stagedInvites.map((i) => (
                  <div key={i.user.id} className="rounded-xl bg-muted/40 px-2 py-1.5">
                    <div className="flex items-center gap-2.5">
                      <InviteRowAvatar name={i.user.name} image={i.user.image} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {i.user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground/60">
                          {i.user.email}
                        </p>
                      </div>
                      <WorkspaceRoleToggle
                        role={i.role}
                        onChange={(role) => s.setStagedInviteRole(i.user.id, role)}
                      />
                      <button
                        type="button"
                        onClick={() => s.removeStagedInvite(i.user.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="pl-11 pt-1 text-[11px] text-muted-foreground/80">
                      {WORKSPACE_ROLE_DESCRIPTIONS[i.role]}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                value={s.inviteEmail}
                onChange={(e) => s.setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault()
                }}
                placeholder="Invite by email..."
                className="h-9 pl-9 text-sm"
                type="email"
              />
            </div>

            {showSearchResult && (
              <div className="rounded-xl border border-border/50 px-2 py-1.5">
                {s.isSearchingInvite ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
                  </div>
                ) : s.inviteSearchResult ? (
                  <div className="flex items-center gap-2.5">
                    <InviteRowAvatar
                      name={s.inviteSearchResult.name}
                      image={s.inviteSearchResult.image}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {s.inviteSearchResult.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground/60">
                        {s.inviteSearchResult.email}
                      </p>
                    </div>
                    {alreadyStaged ? (
                      <span className="text-xs text-muted-foreground/60">Already added</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => s.addStagedInvite(s.inviteSearchResult as ContactProfile)}
                        className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
                      >
                        <UserPlus className="h-3 w-3" />
                        Add
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

          <DialogFooter>
            <Button type="submit" disabled={!s.name.trim() || s.isCreating} className="gap-1.5">
              {s.isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditWorkspaceDialog({ s }: { s: WorkspaceSwitcherState }) {
  return (
    <Dialog open={!!s.editTarget} onOpenChange={(v) => !v && s.closeEditDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={s.handleSubmitEdit} className="space-y-3">
          <Input
            autoFocus
            value={s.editName}
            onChange={(e) => s.setEditName(e.target.value)}
            placeholder="Workspace name..."
          />
          {s.editError && <p className="text-xs text-destructive">{s.editError}</p>}
          <DialogFooter>
            <Button
              type="submit"
              disabled={!s.editName.trim() || s.isEditing}
              className="gap-1.5"
            >
              {s.isEditing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteWorkspaceAlertDialog({ s }: { s: WorkspaceSwitcherState }) {
  return (
    <AlertDialog open={!!s.deleteTarget} onOpenChange={(v) => !v && s.setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{s.deleteTarget?.name}</strong> for every
            member. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={s.confirmDelete} variant="destructive" disabled={s.isDeleting}>
            {s.isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete workspace
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface WorkspaceSwitcherProps {
  initialData?: WorkspacesData
}

export function WorkspaceSwitcher({ initialData }: WorkspaceSwitcherProps) {
  const s = useWorkspaceSwitcher(initialData)

  return (
    <>
      <CreateWorkspaceDialog s={s} />
      <EditWorkspaceDialog s={s} />
      <DeleteWorkspaceAlertDialog s={s} />
      <PlanLimitDialog
        open={!!s.limitDialog}
        onOpenChange={(v) => !v && s.setLimitDialog(null)}
        limitError={s.limitDialog}
      />
      <SafetyCapDialog
        open={!!s.capDialog}
        onOpenChange={(v) => !v && s.setCapDialog(null)}
        capError={s.capDialog}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all"
          >
            <WorkspaceAvatar
              icon={s.activeWorkspace?.icon}
              color={s.activeWorkspace?.color}
              className="size-6"
            />
            <span className="flex-1 truncate text-left">{s.activeWorkspace?.name ?? 'Personal'}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <WorkspaceMenuContent s={s} />
      </DropdownMenu>
    </>
  )
}

export function SidebarWorkspaceSwitcher({ initialData }: WorkspaceSwitcherProps) {
  const s = useWorkspaceSwitcher(initialData)

  return (
    <SidebarMenuItem>
      <CreateWorkspaceDialog s={s} />
      <EditWorkspaceDialog s={s} />
      <DeleteWorkspaceAlertDialog s={s} />
      <PlanLimitDialog
        open={!!s.limitDialog}
        onOpenChange={(v) => !v && s.setLimitDialog(null)}
        limitError={s.limitDialog}
      />
      <SafetyCapDialog
        open={!!s.capDialog}
        onOpenChange={(v) => !v && s.setCapDialog(null)}
        capError={s.capDialog}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" tooltip={s.activeWorkspace?.name ?? 'Personal'}>
            <WorkspaceAvatar
              icon={s.activeWorkspace?.icon}
              color={s.activeWorkspace?.color}
              className="size-8 rounded-md"
            />
            <span className="flex-1 truncate text-left font-semibold">
              {s.activeWorkspace?.name ?? 'Personal'}
            </span>
            <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <WorkspaceMenuContent align="start" s={s} />
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
