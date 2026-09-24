'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Users,
  ListTodo,
  CalendarDays,
  LayoutGrid,
  Plus,
  Check,
  Loader2,
  Trash2,
  Pencil,
} from 'lucide-react'
import { api } from '@/api'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'
import { TeamRolesEditor } from './team-roles-editor'
import { EditTeamDialog } from './edit-team-dialog'
import type { TeamOverview } from '@/api/teams/actions'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
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
]

interface TeamDetailClientProps {
  teamId: number
  initialOverview: TeamOverview
}

export function TeamDetailClient({ teamId, initialOverview }: TeamDetailClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const overviewKey = ['teams', teamId, 'overview']

  const { data: overview } = useQuery({
    queryKey: overviewKey,
    queryFn: () => api.teams.getOverview(teamId),
    initialData: initialOverview,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: overviewKey })

  const [editTeamOpen, setEditTeamOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => api.teams.delete(teamId),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error deleting team')
        return
      }
      toast.info('Team deleted')
      router.push('/teams')
    },
    onError: () => toast.error('Error deleting team'),
  })

  if (!overview) return null
  const canManageTeam = overview.myPermissions.canManageTeamSettings

  return (
    <>
      <EditTeamDialog teamId={teamId} teamName={overview.name} open={editTeamOpen} onOpenChange={setEditTeamOpen} />

      <section className="mb-8 mt-10 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-violet-500" />
            <p className="text-xl font-semibold uppercase text-violet-500 dark:text-violet-400">
              Team
            </p>
          </div>
          <h1 className="truncate text-3xl font-bold tracking-tight text-foreground">
            {overview.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {overview.memberCount} member{overview.memberCount !== 1 ? 's' : ''}
          </p>
        </div>

        {canManageTeam && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEditTeamOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{overview.name}</strong> and its members/roles will be permanently
                    deleted. Lists and calendar categories created through it are kept, just no
                    longer tied to a team. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    variant="destructive"
                    disabled={deleteMutation.isPending}
                  >
                    Delete team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </section>

      <Tabs defaultValue="overview" className="w-full">
        <div className="mb-8">
          <TabsList className="h-10 w-full justify-start gap-1.5 rounded-full bg-transparent p-0 sm:w-auto">
            <TabsTrigger
              value="overview"
              className="gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400"
            >
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="lists"
              className="gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400"
            >
              <ListTodo className="h-3.5 w-3.5 shrink-0" />
              Lists
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400"
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400"
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              Members
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="outline-none">
          <OverviewTab overview={overview} />
        </TabsContent>
        <TabsContent value="lists" className="outline-none">
          <ListsTab teamId={teamId} overview={overview} onChanged={invalidate} />
        </TabsContent>
        <TabsContent value="calendar" className="outline-none">
          <CalendarTab teamId={teamId} overview={overview} onChanged={invalidate} />
        </TabsContent>
        <TabsContent value="members" className="outline-none">
          <MembersTab teamId={teamId} overview={overview} onChanged={invalidate} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function SectionCard({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl bg-card shadow-lg shadow-black/5">
      <div className="flex items-center justify-between border-b border-border/20 px-5 py-4">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {title}
          </span>
        </div>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-8 text-center text-xs text-muted-foreground/60">{text}</p>
  )
}

/* ---------------------------- Overview tab ---------------------------- */

function OverviewTab({ overview }: { overview: TeamOverview }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard
        icon={<ListTodo className="h-3.5 w-3.5 text-violet-500" />}
        title="Lists"
        count={overview.lists.length}
      >
        {overview.lists.length === 0 ? (
          <EmptyState text="No lists in this team yet." />
        ) : (
          <div className="space-y-1">
            {overview.lists.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-xl px-2 py-2 text-sm"
              >
                <span className="truncate text-foreground">{l.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground/60">
                  {l.taskCount} task{l.taskCount !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={<CalendarDays className="h-3.5 w-3.5 text-violet-500" />}
        title="Calendar categories"
        count={overview.calendarCategories.length}
      >
        {overview.calendarCategories.length === 0 ? (
          <EmptyState text="No calendar categories in this team yet." />
        ) : (
          <div className="space-y-1">
            {overview.calendarCategories.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="truncate text-foreground">{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={<Users className="h-3.5 w-3.5 text-violet-500" />}
        title="Members"
        count={overview.members.length}
      >
        {overview.members.length === 0 ? (
          <EmptyState text="No members yet." />
        ) : (
          <div className="space-y-1">
            {overview.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
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
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ----------------------------- Lists tab ------------------------------ */

function ListsTab({
  teamId,
  overview,
  onChanged,
}: {
  teamId: number
  overview: TeamOverview
  onChanged: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.lists.create({ name: name.trim(), category: { color }, teamId }),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(
          result.error === 'DUPLICATE_NAME' || result.error === 'DUPLICATE_NAME_ARCHIVED'
            ? 'A list with this name already exists.'
            : 'Something went wrong. Please try again.',
        )
        return
      }
      toast.info('List created')
      setOpen(false)
      setName('')
      onChanged()
    },
    onError: () => setError('Something went wrong. Please try again.'),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Lists</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {overview.lists.length === 0
              ? 'No lists in this team yet.'
              : `${overview.lists.length} list${overview.lists.length !== 1 ? 's' : ''}.`}
          </p>
        </div>
        {overview.myPermissions.canManageLists && (
          <button
            type="button"
            onClick={() => {
              setError(null)
              setOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
          >
            <Plus className="h-3.5 w-3.5" />
            New list
          </button>
        )}
      </div>

      {overview.lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-card px-6 py-16 text-center shadow-lg shadow-black/5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <ListTodo className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No lists yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Create one above to get this team started.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {overview.lists.map((l) => (
            <Link
              key={l.id}
              href={`/lists/${l.slug}`}
              className="flex items-center justify-between rounded-2xl bg-card px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="truncate text-sm font-medium text-foreground">{l.name}</span>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {l.taskCount} task{l.taskCount !== 1 ? 's' : ''}
              </span>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New list</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) {
                setError('Name is required')
                return
              }
              setError(null)
              mutation.mutate()
            }}
            className="space-y-4 pt-1"
          >
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="team-list-name">Name</Label>
              <Input
                id="team-list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name..."
                className="h-10"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-6 w-6 rounded-full transition-all',
                      color === c ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : '',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || !name.trim()}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Create
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------------------------- Calendar tab ----------------------------- */

function CalendarTab({
  teamId,
  overview,
  onChanged,
}: {
  teamId: number
  overview: TeamOverview
  onChanged: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.calendar.categories.create({ name: name.trim(), color }, teamId),
    onSuccess: (result) => {
      if (!result.ok) {
        setError('Something went wrong. Please try again.')
        return
      }
      toast.info('Category created')
      setOpen(false)
      setName('')
      onChanged()
    },
    onError: () => setError('Something went wrong. Please try again.'),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Calendar categories
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {overview.calendarCategories.length === 0
              ? 'No calendar categories in this team yet.'
              : `${overview.calendarCategories.length} categor${overview.calendarCategories.length !== 1 ? 'ies' : 'y'}.`}
          </p>
        </div>
        {overview.myPermissions.canManageCalendar && (
          <button
            type="button"
            onClick={() => {
              setError(null)
              setOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
          >
            <Plus className="h-3.5 w-3.5" />
            New category
          </button>
        )}
      </div>

      {overview.calendarCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-card px-6 py-16 text-center shadow-lg shadow-black/5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <CalendarDays className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No categories yet</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {overview.calendarCategories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2.5 rounded-2xl bg-card px-4 py-3.5 shadow-sm"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="truncate text-sm font-medium text-foreground">{c.name}</span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New calendar category</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) {
                setError('Name is required')
                return
              }
              setError(null)
              mutation.mutate()
            }}
            className="space-y-4 pt-1"
          >
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="team-category-name">Name</Label>
              <Input
                id="team-category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category name..."
                className="h-10"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-6 w-6 rounded-full transition-all',
                      color === c ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : '',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || !name.trim()}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Create
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------------------------- Members tab ------------------------------ */

function MembersTab({
  teamId,
  overview,
  onChanged,
}: {
  teamId: number
  overview: TeamOverview
  onChanged: () => void
}) {
  const rolesKey = ['teams', teamId, 'roles']
  const { data: rolesData } = useQuery({
    queryKey: rolesKey,
    queryFn: () => api.teams.listRoles(teamId),
  })
  const roles = rolesData ?? []
  const canManage = overview.myPermissions.canManageMembers

  const { data: workspaceMembersData } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: () => api.workspaces.listMembers(),
    enabled: canManage,
  })
  const candidateMembers = (workspaceMembersData?.docs ?? []).filter(
    (m) => !overview.members.some((tm) => tm.userId === m.userId),
  )

  const [addOpen, setAddOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addMemberMutation = useMutation({
    mutationFn: () => api.teams.addMember(teamId, selectedUserId as string, selectedRoleId as number),
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.info('Member added')
      setAddOpen(false)
      setSelectedUserId(null)
      setSelectedRoleId(null)
      onChanged()
    },
    onError: () => setError('Something went wrong. Please try again.'),
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: number; roleId: number }) =>
      api.teams.updateMemberRole(memberId, roleId),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error updating member')
        return
      }
      onChanged()
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => api.teams.removeMember(memberId),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error || 'Error removing member')
        return
      }
      toast.info('Member removed')
      onChanged()
    },
  })


  return (
    <div className="space-y-8">
      <TeamRolesEditor teamId={teamId} canManage={canManage} />

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Members</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {overview.members.length} member{overview.members.length !== 1 ? 's' : ''} in this
              team.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setError(null)
                setAddOpen(true)
              }}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
            >
              <Plus className="h-3.5 w-3.5" />
              Add member
            </button>
          )}
        </div>

        <div className="rounded-3xl bg-card shadow-lg shadow-black/5">
          <div className="p-3 sm:p-5">
            {overview.members.length === 0 ? (
              <EmptyState text="No members yet — add one above." />
            ) : (
              <div className="space-y-1">
                {overview.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-muted/40 transition-colors"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={m.image ?? undefined} alt={m.name} />
                      <AvatarFallback className="bg-violet-500/10 text-xs font-semibold text-violet-600 dark:text-violet-400">
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-sm font-medium text-foreground">
                      {m.name}
                    </span>
                    {canManage ? (
                      <select
                        value={roles.find((r) => r.name === m.roleName)?.id ?? ''}
                        onChange={(e) => {
                          const roleId = Number(e.target.value)
                          if (roleId) updateMemberRoleMutation.mutate({ memberId: m.id, roleId })
                        }}
                        className="h-7 rounded-md border border-border/60 bg-background px-1.5 text-xs"
                      >
                        {!roles.some((r) => r.name === m.roleName) && (
                          <option value="">{m.roleName}</option>
                        )}
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {m.roleName}
                      </span>
                    )}
                    {canManage && (
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
                ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {canManage && (
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/50 p-1.5">
              {candidateMembers.length === 0 ? (
                <EmptyState text="Everyone in the workspace is already on this team." />
              ) : (
                candidateMembers.map((m) => (
                  <label
                    key={m.userId}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors',
                      selectedUserId === m.userId ? 'bg-violet-500/5' : 'hover:bg-muted/40',
                    )}
                  >
                    <Checkbox
                      checked={selectedUserId === m.userId}
                      onCheckedChange={() => setSelectedUserId(m.userId)}
                    />
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={m.image ?? undefined} alt={m.nickname || m.name} />
                      <AvatarFallback className="bg-violet-500/10 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                        {getInitials(m.nickname || m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm text-foreground">
                      {m.nickname || m.name}
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              {roles.length === 0 ? (
                <p className="text-xs text-muted-foreground/60">
                  Add a role above first, then come back here.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoleId(r.id)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                        selectedRoleId === r.id
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                          : 'bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedUserId) {
                    setError('Pick a member')
                    return
                  }
                  if (!selectedRoleId) {
                    setError('Pick a role')
                    return
                  }
                  setError(null)
                  addMemberMutation.mutate()
                }}
                disabled={addMemberMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {addMemberMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Add
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
}
