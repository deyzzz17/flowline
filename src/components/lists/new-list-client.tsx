'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { useSession } from '@/lib/auth-client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, Check, Loader2, Users, UserPlus, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateList } from '@/hooks/lists/use-create-list'
import { toast } from 'sonner'
import { LIMIT_ERRORS, SAFETY_CAP_ERRORS, type LimitError, type SafetyCapError } from '@/lib/plan-limits'
import { PlanLimitDialog } from '../ui/plan-limit-dialog'
import { SafetyCapDialog } from '../ui/safety-cap-dialog'
import { useActiveWorkspace } from '@/components/dashboard/workspace-switcher'
import type { WorkspaceMember } from '@/api/workspaces/actions'
import type { ListMemberRole } from '@/api/list-members/actions'
import { RoleToggle, RolePermissionsHint } from './role-toggle'

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

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

function MemberRowAvatar({ name, image }: { name: string; image?: string | null }) {
  return (
    <Avatar className="h-9 w-9 shrink-0">
      <AvatarImage src={image ?? undefined} alt={name} />
      <AvatarFallback className="bg-violet-500/10 text-xs font-semibold text-violet-600 dark:text-violet-400">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

export const NewListClient = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const activeWorkspace = useActiveWorkspace()
  const isWorkspaceActive = !!activeWorkspace && !activeWorkspace.isPersonal

  const {
    name,
    setName,
    categoryName,
    setCategoryName,
    color,
    setColor,
    error,
    setError,
    limitOpen,
    setLimitOpen,
  } = useCreateList()

  const [capError, setCapError] = useState<SafetyCapError | null>(null)
  const [limitErrorType, setLimitErrorType] = useState<LimitError>(LIMIT_ERRORS.LISTS_LIMIT)
  const [memberLimitError, setMemberLimitError] = useState<LimitError | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [invitees, setInvitees] = useState<{ user: WorkspaceMember; role: ListMemberRole }[]>([])

  const { data: workspaceMembersData } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: () => api.workspaces.listMembers(),
    enabled: isWorkspaceActive,
  })

  const invitedUserIds = useMemo(() => new Set(invitees.map((i) => i.user.userId)), [invitees])

  const invitableMembers = useMemo(() => {
    const members = workspaceMembersData?.docs ?? []
    const q = memberSearch.trim().toLowerCase()
    return members.filter((m) => {
      if (m.userId === currentUserId) return false
      if (invitedUserIds.has(m.userId)) return false
      if (!q) return true
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    })
  }, [workspaceMembersData, invitedUserIds, memberSearch, currentUserId])

  const addInvitee = (user: WorkspaceMember) => {
    setInvitees((prev) => [...prev, { user, role: 'editor' }])
  }

  const removeInvitee = (userId: string) => {
    setInvitees((prev) => prev.filter((i) => i.user.userId !== userId))
  }

  const setInviteeRole = (userId: string, role: ListMemberRole) => {
    setInvitees((prev) => prev.map((i) => (i.user.userId === userId ? { ...i, role } : i)))
  }

  const mutation = useMutation({
    mutationFn: () =>
      isWorkspaceActive
        ? api.listMembers.createShared({
            name: name.trim(),
            category: { name: categoryName.trim() || undefined, color },
            invites: invitees.map((i) => ({ userId: i.user.userId, role: i.role })),
          })
        : api.lists.create({
            name: name.trim(),
            category: { name: categoryName.trim() || undefined, color },
          }),
    onSuccess: (result) => {
      if (!result.ok) {
        if (result.error === LIMIT_ERRORS.LISTS_LIMIT || result.error === LIMIT_ERRORS.SHARED_LISTS_LIMIT) {
          setLimitErrorType(result.error)
          setLimitOpen(true)
          return
        }
        if (
          result.error === SAFETY_CAP_ERRORS.LISTS_CAP ||
          result.error === SAFETY_CAP_ERRORS.SHARED_LISTS_CAP
        ) {
          setCapError(SAFETY_CAP_ERRORS.LISTS_CAP)
          return
        }
        if (result.error === LIMIT_ERRORS.SHARED_LIST_MEMBERS_LIMIT) {
          setMemberLimitError(LIMIT_ERRORS.SHARED_LIST_MEMBERS_LIMIT)
          return
        }
        setError(
          result.error === 'DUPLICATE_NAME_ARCHIVED'
            ? `An archived list named "${name.trim()}" already exists. Please choose a different name.`
            : result.error === 'DUPLICATE_NAME'
              ? `A list named "${name.trim()}" already exists. Please choose a different name.`
              : 'Something went wrong while creating the list. Please try again.',
        )
        return
      }
      toast.info('List created', {
        description:
          invitees.length > 0
            ? `${invitees.length} ${invitees.length === 1 ? 'member has' : 'members have'} been added.`
            : 'Your list is successfully created.',
      })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      router.push(`/lists/${result.value.slug}`)
    },
    onError: () => {
      toast.error('Error while creating the list', {
        description: `Something went wrong while creating the list. Please try again.`,
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    setError(null)
    mutation.mutate()
  }

  return (
    <div className="mx-auto max-w-lg mt-10">
      <div className="mb-8">
        <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
          Lists
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">New list</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Create a new list to organize your tasks.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="e.g. Work, Personal, Shopping..."
              className={cn(
                'h-11 transition-all',
                error &&
                  !name.trim() &&
                  'border-destructive focus-visible:ring-destructive bg-destructive/5',
              )}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category{' '}
              <span className="text-xs font-normal text-muted-foreground ml-1">Optional</span>
            </Label>
            <Input
              id="category"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Work, Health, Finance..."
              className="h-11"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    color === c ? 'scale-110' : 'hover:scale-105',
                  )}
                  style={{
                    backgroundColor: c,
                    ...(color === c && {
                      outline: `3px solid ${c}`,
                      outlineOffset: '2px',
                    }),
                  }}
                />
              ))}
              <div className="relative">
                <div
                  className="h-8 w-8 rounded-full border-2 border-dashed border-border/60 cursor-pointer overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: PRESET_COLORS.includes(color) ? 'transparent' : color }}
                />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                />
              </div>
            </div>

            <div
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium"
              style={{
                backgroundColor: hexToRgba(color, 0.1),
                borderColor: hexToRgba(color, 0.3),
                color,
              }}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {name || 'Preview'}
              {categoryName && <span className="text-xs opacity-70">· {categoryName}</span>}
            </div>
          </div>
        </div>

        {isWorkspaceActive && (
          <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              <p className="text-sm font-medium text-foreground">Add members</p>
              <span className="text-xs font-normal text-muted-foreground">Optional</span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Only members of <strong>{activeWorkspace?.name}</strong> can be added to a list.
            </p>

            {invitees.length > 0 && (
              <div className="space-y-2">
                {invitees.map((i) => (
                  <div key={i.user.userId} className="rounded-xl bg-muted/40 px-2 py-1.5">
                    <div className="flex items-center gap-2.5">
                      <MemberRowAvatar name={i.user.name} image={i.user.image} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {i.user.name}
                        </p>
                      </div>
                      <RoleToggle
                        role={i.role}
                        onChange={(role) => setInviteeRole(i.user.userId, role)}
                      />
                      <button
                        type="button"
                        onClick={() => removeInvitee(i.user.userId)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <RolePermissionsHint role={i.role} className="pl-11 pt-1.5" />
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search workspace members..."
                className="h-9 pl-9 text-sm"
              />
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {invitableMembers.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground/60">
                  {memberSearch
                    ? 'No members match your search.'
                    : workspaceMembersData
                      ? 'No more members to add.'
                      : 'Loading workspace members...'}
                </p>
              ) : (
                invitableMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-muted/40 transition-colors"
                  >
                    <MemberRowAvatar name={m.name} image={m.image} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground/60">{m.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addInvitee(m)}
                      className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
                    >
                      <UserPlus className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className="gap-2 bg-violet-600 hover:bg-violet-500 px-8"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Create list
              </>
            )}
          </Button>
        </div>
      </form>

      <PlanLimitDialog open={limitOpen} onOpenChange={setLimitOpen} limitError={limitErrorType} />
      <PlanLimitDialog
        open={!!memberLimitError}
        onOpenChange={(v) => {
          if (!v) setMemberLimitError(null)
        }}
        limitError={memberLimitError}
      />
      <SafetyCapDialog
        open={!!capError}
        onOpenChange={(v) => {
          if (!v) setCapError(null)
        }}
        capError={capError}
      />
    </div>
  )
}
