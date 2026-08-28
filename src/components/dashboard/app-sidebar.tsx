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
  PanelLeft,
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { PlanLimitDialog } from '../ui/plan-limit-dialog'
import { SafetyCapDialog } from '../ui/safety-cap-dialog'
import { SidebarNewsletter } from './sidebar-newsletter'
import { FeedbackDialog } from '../support/feedback-dialog'
import {
  SidebarWorkspaceSwitcher,
  useActiveWorkspace,
  type WorkspacesData,
} from './workspace-switcher'
import { SidebarCalendarNavSection } from './calendar-nav-section'

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

function SharedListMenuItem({
  list,
  isActive,
  href,
}: {
  list: List
  isActive: boolean
  href: string
}) {
  const urgency = useListUrgency(list.id)

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={isActive}>
        <Link href={href}>
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
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

export function AppSidebar({ initialWorkspaces }: { initialWorkspaces?: WorkspacesData }) {
  const pathname = usePathname()
  const { setOpenMobile, state, isMobile, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { feedbackOpen, setFeedbackOpen } = useSidebarFooter()
  const planLimits = usePlanLimits()
  const sharedLists = useSharedLists()
  const activeWorkspace = useActiveWorkspace(initialWorkspaces)
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

  const nav = (href: string) => {
    setOpenMobile(false)
    return href
  }
  const isActive = (href: string) => pathname === href
  const isHabitsActive = pathname.startsWith('/habits')

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

      <Sidebar
        collapsible={isMobile ? 'offcanvas' : 'icon'}
        className="border-r border-border/60"
        style={
          {
            top: 'var(--header-height, 4rem)',
            height: 'calc(100svh - var(--header-height, 4rem))',
          } as React.CSSProperties
        }
      >
        <SidebarContent className="flex-1 min-h-0">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/dashboard')} tooltip="Home">
                    <Link href={nav('/dashboard')}>
                      <Home className="h-4 w-4 shrink-0" />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/contacts')} tooltip="Contacts">
                    <Link href={nav('/contacts')}>
                      <Users className="h-4 w-4 shrink-0" />
                      <span>Contacts</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarCalendarNavSection scope="global" href="/calendar" label="Calendar" />

                <Collapsible asChild className="group/habits" disabled={isCollapsed}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Habits"
                        isActive={isHabitsActive}
                        className={cn(isCollapsed && 'pointer-events-none')}
                      >
                        <Flame className="h-4 w-4 shrink-0" />
                        <span>Habits</span>
                        <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=closed]/habits:-rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive('/habits/habits-view')}>
                            <Link href={nav('/habits/habits-view')}>
                              <Flame className="h-3.5 w-3.5" />
                              Habits
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive('/habits/habits-analytics')}
                          >
                            <Link href={nav('/habits/habits-analytics')}>
                              <BarChart2 className="h-3.5 w-3.5" />
                              Analytics
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="mx-3 w-auto" />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarWorkspaceSwitcher initialData={initialWorkspaces} />

                <Collapsible asChild className="group/lists" disabled={isCollapsed}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Lists"
                        className={cn(isCollapsed && 'pointer-events-none')}
                      >
                        <ClipboardList className="h-4 w-4 shrink-0" />
                        <span>Lists</span>
                        <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=closed]/lists:-rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive('/list-analytics')}>
                            <Link href={nav('/list-analytics')}>
                              <BarChart2 className="h-3.5 w-3.5" />
                              Analytics
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive('/lists/today')}>
                            <Link href={nav('/lists/today')}>
                              <Sun className="h-3.5 w-3.5" />
                              Today
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive('/lists/recurring')}>
                            <Link href={nav('/lists/recurring')}>
                              <RefreshCw className="h-3.5 w-3.5" />
                              Recurring
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <div className="my-1.5 border-t border-border/40 mx-2" />
                        {defaultList && (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(`/lists/${defaultList.slug}`)}
                            >
                              <Link href={nav(`/lists/${defaultList.slug}`)}>
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: defaultList.category?.color ?? '#8b5cf6',
                                  }}
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
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )}
                        {customLists.map((list: List) => (
                          <SidebarMenuSubItem key={list.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(`/lists/${list.slug}`)}
                            >
                              <Link href={nav(`/lists/${list.slug}`)}>
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
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link
                              href={nav('/lists/new-list')}
                              className="text-muted-foreground/60"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              New list
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        <div className="my-1.5 border-t border-border/40 mx-2" />

                        <div className="mt-1 mb-1 flex items-center gap-1.5 px-2">
                          <Users className="h-3 w-3 text-violet-500/70" />
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-500/70">
                            Shared
                          </span>
                        </div>
                        {[...ownSharedLists, ...invitedSharedLists].map((list) => (
                          <SharedListMenuItem
                            key={list.id}
                            list={list}
                            isActive={isActive(`/lists/${list.slug}`)}
                            href={nav(`/lists/${list.slug}`)}
                          />
                        ))}
                        <SidebarMenuSubItem>
                          {planLimits?.plan === 'free' ? (
                            <div className="flex h-7 items-center gap-2 rounded-md px-2 text-xs text-muted-foreground/40">
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
                            <SidebarMenuSubButton asChild>
                              <Link
                                href={nav('/lists/new-shared-list')}
                                className="text-muted-foreground/60"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                New shared list
                              </Link>
                            </SidebarMenuSubButton>
                          )}
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                <Collapsible asChild className="group/timer" disabled={isCollapsed}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Timer"
                        className={cn(isCollapsed && 'pointer-events-none')}
                      >
                        <Timer className="h-4 w-4 shrink-0" />
                        <span>Timer</span>
                        <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=closed]/timer:-rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive('/timer')}>
                            <Link href={nav('/timer')}>
                              <Timer className="h-3.5 w-3.5" />
                              Timer
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive('/timer-analytics')}>
                            <Link href={nav('/timer-analytics')}>
                              <BarChart2 className="h-3.5 w-3.5" />
                              Analytics
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                {activeWorkspace && !activeWorkspace.isPersonal && (
                  <SidebarCalendarNavSection
                    scope="workspace"
                    href="/workspace-calendar"
                    label="Workspace Calendar"
                  />
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border/40 shrink-0">
          {!isCollapsed && <SidebarNewsletter />}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Support">
                <Link href={nav('/support')}>
                  <HelpCircle className="h-4 w-4" />
                  <span>Support</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setFeedbackOpen(true)} tooltip="Feedback">
                <MessageSquare className="h-4 w-4" />
                <span>Feedback</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="border-t border-border/40 pt-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => toggleSidebar()}
                  tooltip="Expand menu"
                  className="text-muted-foreground"
                >
                  <PanelLeft className="h-4 w-4 shrink-0" />
                  <span>Collapse menu</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
