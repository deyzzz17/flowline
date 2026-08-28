'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Check, ChevronsUpDown, Loader2, Plus, Zap } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import type { Workspace } from '@/payload-types'
import { cn } from '@/lib/utils'

// Query keys whose data depends on the active workspace — invalidated (not a
// full page reload) when switching, so the switch feels instant.
const WORKSPACE_SCOPED_QUERY_KEYS = [
  'lists',
  'timer-configs',
  'timer-categories',
  'timer-analytics',
  'calendar-categories',
  'calendar-events-flowline',
  'calendar-events-google',
]

function WorkspaceAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400',
        className,
      )}
    >
      <Building2 className="h-4 w-4" />
    </span>
  )
}

export type WorkspacesData = { docs: Workspace[]; activeId: number | null }

function useWorkspaceSwitcher(initialData?: WorkspacesData) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const planLimits = usePlanLimits()

  const { data } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.workspaces.list(),
    ...(initialData && { initialData }),
  })

  const workspaces = (data?.docs ?? []) as Workspace[]
  const activeId = data?.activeId ?? null
  const activeWorkspace = workspaces.find((w) => w.id === activeId) ?? workspaces[0]
  const extraCount = workspaces.filter((w) => !w.isPersonal).length

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [limitDialog, setLimitDialog] = useState<LimitError | null>(null)
  const [capDialog, setCapDialog] = useState<SafetyCapError | null>(null)

  const switchMutation = useMutation({
    mutationFn: (id: number) => api.workspaces.switch(id),
    onSuccess: (result) => {
      if (!result.ok) return
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      for (const key of WORKSPACE_SCOPED_QUERY_KEYS) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
      router.push('/lists/today')
    },
  })

  const createMutation = useMutation({
    mutationFn: () => api.workspaces.create(name.trim()),
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
      setCreateError(null)
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
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
    setCreateError(null)
    setCreateOpen(true)
  }

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || createMutation.isPending) return
    createMutation.mutate()
  }

  return {
    workspaces,
    activeId,
    activeWorkspace,
    atLimit,
    switchTo: (id: number) => switchMutation.mutate(id),
    switchingId: switchMutation.isPending ? switchMutation.variables : null,
    openCreateDialog,
    handleLockedClick,
    createOpen,
    setCreateOpen,
    name,
    setName,
    createError,
    handleSubmitCreate,
    isCreating: createMutation.isPending,
    limitDialog,
    setLimitDialog,
    capDialog,
    setCapDialog,
  }
}

function WorkspaceMenuContent({
  align,
  workspaces,
  activeId,
  switchingId,
  onSwitch,
  atLimit,
  onCreateClick,
  onLockedClick,
}: {
  align?: 'start' | 'center' | 'end'
  workspaces: Workspace[]
  activeId: number | null
  switchingId: number | null
  onSwitch: (id: number) => void
  atLimit: boolean
  onCreateClick: () => void
  onLockedClick: () => void
}) {
  return (
    <DropdownMenuContent align={align ?? 'start'} className="w-56">
      <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Workspaces
      </DropdownMenuLabel>
      {workspaces.map((w) => (
        <DropdownMenuItem
          key={w.id}
          disabled={switchingId !== null}
          onClick={() => w.id !== activeId && onSwitch(w.id)}
          className="gap-2 text-sm cursor-pointer"
        >
          <WorkspaceAvatar className="size-6" />
          <span className="flex-1 truncate">{w.name}</span>
          {switchingId === w.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            w.id === activeId && <Check className="h-3.5 w-3.5 text-violet-500" />
          )}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      {atLimit ? (
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground/50">
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">Create new workspace</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onLockedClick()
            }}
            className="shrink-0 text-violet-500/70 transition-colors hover:text-violet-500"
            title="Upgrade to create more workspaces"
          >
            <Zap className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <DropdownMenuItem onClick={onCreateClick} className="gap-2.5 text-sm cursor-pointer">
          <Plus className="h-3.5 w-3.5 shrink-0" />
          Create new workspace
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  )
}

function CreateWorkspaceDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  error,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  onNameChange: (value: string) => void
  error: string | null
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            autoFocus
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Workspace name..."
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || isPending} className="gap-1.5">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface WorkspaceSwitcherProps {
  initialData?: WorkspacesData
}

export function WorkspaceSwitcher({ initialData }: WorkspaceSwitcherProps) {
  const s = useWorkspaceSwitcher(initialData)

  return (
    <>
      <CreateWorkspaceDialog
        open={s.createOpen}
        onOpenChange={s.setCreateOpen}
        name={s.name}
        onNameChange={s.setName}
        error={s.createError}
        onSubmit={s.handleSubmitCreate}
        isPending={s.isCreating}
      />
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
            <WorkspaceAvatar className="size-6" />
            <span className="flex-1 truncate text-left">{s.activeWorkspace?.name ?? 'Personal'}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <WorkspaceMenuContent
          workspaces={s.workspaces}
          activeId={s.activeId}
          switchingId={s.switchingId}
          onSwitch={s.switchTo}
          atLimit={s.atLimit}
          onCreateClick={s.openCreateDialog}
          onLockedClick={s.handleLockedClick}
        />
      </DropdownMenu>
    </>
  )
}

export function SidebarWorkspaceSwitcher({ initialData }: WorkspaceSwitcherProps) {
  const s = useWorkspaceSwitcher(initialData)

  return (
    <SidebarMenuItem>
      <CreateWorkspaceDialog
        open={s.createOpen}
        onOpenChange={s.setCreateOpen}
        name={s.name}
        onNameChange={s.setName}
        error={s.createError}
        onSubmit={s.handleSubmitCreate}
        isPending={s.isCreating}
      />
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
            <WorkspaceAvatar className="size-8 rounded-md" />
            <span className="flex-1 truncate text-left font-semibold">
              {s.activeWorkspace?.name ?? 'Personal'}
            </span>
            <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <WorkspaceMenuContent
          align="start"
          workspaces={s.workspaces}
          activeId={s.activeId}
          switchingId={s.switchingId}
          onSwitch={s.switchTo}
          atLimit={s.atLimit}
          onCreateClick={s.openCreateDialog}
          onLockedClick={s.handleLockedClick}
        />
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
