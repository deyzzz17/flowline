'use client'

import {
  Home,
  Sun,
  RefreshCw,
  ClipboardList,
  Plus,
  ChevronDown,
  MessageSquare,
  HelpCircle,
  Timer,
  BarChart2,
  ChevronRight,
  Flame,
  Users,
  UserPlus,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { api } from '@/api'
import { useSidebarFooter } from '@/hooks/sidebar/use-sidebar-footer'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import { useSharedLists } from '@/hooks/lists/use-shared-lists'
import { useListUrgency } from '@/hooks/tasks/use-list-urgency'
import { cn } from '@/lib/utils'
import type { Task, List } from '@/payload-types'
import {
  LIMIT_ERRORS,
  type LimitError,
  type SafetyCapError,
} from '@/lib/plan-limits'
import { PlanLimitDialog } from '../ui/plan-limit-dialog'
import { SafetyCapDialog } from '../ui/safety-cap-dialog'
import { SidebarNewsletter } from './sidebar-newsletter'
import { FeedbackDialog } from '../support/feedback-dialog'
import { WorkspaceSwitcher, useActiveWorkspace, type WorkspacesData } from './workspace-switcher'
import { CalendarNavSection } from './calendar-nav-section'

function getListUrgency(tasks: Task[]): 'red' | 'orange' | null {
  const now = Date.now()
  let hasOrange = false
  for (const task of tasks) {
    if (task.status !== 'active' || !task.dueDate) continue
    const diff = new Date(task.dueDate).getTime() - now
    if (diff <= 86400000) return 'red'
    if (diff <= 172800000) hasOrange = true
  }
  return hasOrange ? 'orange' : null
}

function SharedListLink({
  list,
  isActive,
  navLink,
}: {
  list: List
  isActive: boolean
  navLink: { href: string; onClick?: () => void }
}) {
  const urgency = useListUrgency(list.id)

  return (
    <Link
      {...navLink}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
        isActive
          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: list.category?.color ?? '#8b5cf6' }}
      />
      <span className="flex-1 truncate">{list.name}</span>
      {urgency && (
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            urgency === 'red' ? 'bg-destructive' : 'bg-orange-500',
          )}
        />
      )}
      <Users className="h-3 w-3 shrink-0 text-violet-500/50" />
    </Link>
  )
}

interface SidebarNavContentProps {
  onNavigate?: () => void
  initialWorkspaces?: WorkspacesData
}

export function SidebarNavContent({ onNavigate, initialWorkspaces }: SidebarNavContentProps) {
  const pathname = usePathname()
  const { feedbackOpen, setFeedbackOpen } = useSidebarFooter()
  const planLimits = usePlanLimits()
  const sharedLists = useSharedLists()
  const activeWorkspace = useActiveWorkspace(initialWorkspaces)

  const [listsOpen, setListsOpen] = useState(false)
  const [habitsOpen, setHabitsOpen] = useState(false)
  const [timerOpen, setTimerOpen] = useState(false)
  const [limitDialog, setLimitDialog] = useState<LimitError | null>(null)
  const [capDialog, setCapDialog] = useState<SafetyCapError | null>(null)

  const { data: listsData } = useQuery({ queryKey: ['lists'], queryFn: () => api.lists.list() })
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    staleTime: 0,
  })

  const lists = (listsData?.docs ?? []) as List[]
  const allTasks = (tasksData?.docs ?? []) as Task[]
  const defaultList = lists.find((l: List) => l.isDefault)
  const customLists = lists.filter((l: List) => !l.isDefault && !l.isShared)
  const ownSharedLists = lists.filter((l: List) => l.isShared)
  // Lists shared WITH us aren't workspace-scoped yet — for now they only show
  // up under the Personal workspace.
  const isPersonalActive = !activeWorkspace || activeWorkspace.isPersonal
  const invitedSharedLists = isPersonalActive ? sharedLists : []

  const tasksByList = allTasks.reduce<Record<number, Task[]>>((acc, task) => {
    const listId =
      typeof task.list === 'object' && task.list !== null
        ? (task.list as { id: number }).id
        : typeof task.list === 'number'
          ? task.list
          : null
    if (listId !== null) {
      if (!acc[listId]) acc[listId] = []
      acc[listId].push(task)
    }
    return acc
  }, {})

  const isActive = (href: string) => pathname === href
  const navLink = (href: string) => ({ href, onClick: onNavigate })

  const SubChevron = ({ open }: { open: boolean }) =>
    open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />

  return (
    <>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />

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

      <div className="flex flex-1 flex-col h-full overflow-hidden">
        <nav className="flex-1 overflow-y-auto min-h-0 p-3 space-y-1 sidebar-scroll">
          <Link
            {...navLink('/dashboard')}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              isActive('/dashboard')
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            Home
          </Link>

          <Link
            {...navLink('/contacts')}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              isActive('/contacts')
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            Contacts
          </Link>

          <CalendarNavSection
            scope="global"
            href="/calendar"
            label="Calendar"
            onNavigate={onNavigate}
          />

          <div>
            <button
              type="button"
              onClick={() => setHabitsOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-3">
                <Flame className="h-4 w-4 shrink-0" />
                Habits
              </div>
              <SubChevron open={habitsOpen} />
            </button>
            {habitsOpen && (
              <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border/50 pl-3">
                <Link
                  {...navLink('/habits/habits-view')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive('/habits/habits-view')
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Flame className="h-3.5 w-3.5 shrink-0" />
                  Habits
                </Link>
                <Link
                  {...navLink('/habits/habits-analytics')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive('/habits/habits-analytics')
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <BarChart2 className="h-3.5 w-3.5 shrink-0" />
                  Analytics
                </Link>
              </div>
            )}
          </div>

          <div className="my-2 border-t border-border/60" />

          <WorkspaceSwitcher initialData={initialWorkspaces} />

          <div>
            <button
              type="button"
              onClick={() => setListsOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-4 w-4 shrink-0" />
                Lists
              </div>
              <SubChevron open={listsOpen} />
            </button>
            {listsOpen && (
              <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border/50 pl-3">
                <Link
                  {...navLink('/list-analytics')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive('/list-analytics')
                      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <BarChart2 className="h-3.5 w-3.5 shrink-0" />
                  Analytics
                </Link>
                <Link
                  {...navLink('/lists/today')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive('/lists/today')
                      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Sun className="h-3.5 w-3.5 shrink-0" />
                  Today
                </Link>
                <Link
                  {...navLink('/lists/recurring')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive('/lists/recurring')
                      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  Recurring
                </Link>
                <div className="my-1.5 border-t border-border/40" />
                {defaultList && (
                  <Link
                    {...navLink(`/lists/${defaultList.slug}`)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                      isActive(`/lists/${defaultList.slug}`)
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: defaultList.category?.color ?? '#8b5cf6' }}
                    />
                    <span className="flex-1 truncate">{defaultList.name}</span>
                    {getListUrgency(tasksByList[defaultList.id] ?? []) && (
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          getListUrgency(tasksByList[defaultList.id] ?? []) === 'red'
                            ? 'bg-destructive'
                            : 'bg-orange-500',
                        )}
                      />
                    )}
                  </Link>
                )}
                {customLists.map((list: List) => (
                  <Link
                    key={list.id}
                    {...navLink(`/lists/${list.slug}`)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                      isActive(`/lists/${list.slug}`)
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: list.category?.color ?? '#8b5cf6' }}
                    />
                    <span className="flex-1 truncate">{list.name}</span>
                    {getListUrgency(tasksByList[list.id] ?? []) && (
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          getListUrgency(tasksByList[list.id] ?? []) === 'red'
                            ? 'bg-destructive'
                            : 'bg-orange-500',
                        )}
                      />
                    )}
                  </Link>
                ))}
                <Link
                  {...navLink('/lists/new-list')}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-all"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  New list
                </Link>

                <div className="my-1.5 border-t border-border/40" />

                <div className="mt-1 mb-1 flex items-center gap-1.5 px-3">
                  <Users className="h-3 w-3 text-violet-500/70" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-500/70">
                    Shared
                  </span>
                </div>
                {[...ownSharedLists, ...invitedSharedLists].map((list) => (
                  <SharedListLink
                    key={list.id}
                    list={list}
                    isActive={isActive(`/lists/${list.slug}`)}
                    navLink={navLink(`/lists/${list.slug}`)}
                  />
                ))}
                {planLimits?.plan === 'free' ? (
                  <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground/40">
                    <UserPlus className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">New shared list</span>
                    <button
                      type="button"
                      onClick={() => setLimitDialog(LIMIT_ERRORS.SHARED_LISTS_LIMIT)}
                      className="shrink-0 text-violet-500/70 transition-colors hover:text-violet-500"
                      title="Upgrade to Plus or Pro to create shared lists"
                    >
                      <Zap className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <Link
                    {...navLink('/lists/new-shared-list')}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-all"
                  >
                    <UserPlus className="h-3.5 w-3.5 shrink-0" />
                    New shared list
                  </Link>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setTimerOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-3">
                <Timer className="h-4 w-4 shrink-0" />
                Timer
              </div>
              <SubChevron open={timerOpen} />
            </button>
            {timerOpen && (
              <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border/50 pl-3">
                <Link
                  {...navLink('/timer')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive('/timer')
                      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Timer className="h-3.5 w-3.5 shrink-0" />
                  Timer
                </Link>
                <Link
                  {...navLink('/timer-analytics')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive('/timer-analytics')
                      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <BarChart2 className="h-3.5 w-3.5 shrink-0" />
                  Analytics
                </Link>
              </div>
            )}
          </div>

          {activeWorkspace && !activeWorkspace.isPersonal && (
            <CalendarNavSection
              scope="workspace"
              href="/workspace-calendar"
              label="Workspace Calendar"
              onNavigate={onNavigate}
            />
          )}
        </nav>

        <div className="shrink-0 p-3 space-y-1">
          <SidebarNewsletter />
          <div className="border-t border-border/40 pt-2 space-y-0.5">
            <Link
              {...navLink('/support')}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              Support
            </Link>
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              Feedback
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
