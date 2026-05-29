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
  CalendarDays,
  X,
  Check,
  Loader2,
  PanelLeft,
  Flame,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { api } from '@/api'
import { useCalendarCategories } from '@/hooks/calendar/use-calendar-categories'
import { useCalendarFilter } from '../calendar/calendar-filter-context'
import { useSidebarFooter } from '@/hooks/sidebar/use-sidebar-footer'
import { cn } from '@/lib/utils'
import type { Task } from '@/payload-types'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { SidebarNewsletter } from './sidebar-newsletter'
import { FeedbackDialog } from '../support/feedback-dialog'

const PRESET_COLORS = [
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
  '#14b8a6',
]

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

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, state, isMobile, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { feedbackOpen, setFeedbackOpen } = useSidebarFooter()
  const { categories, createMutation, updateMutation, deleteMutation } = useCalendarCategories()
  const { hiddenCategories, toggleCategory } = useCalendarFilter()

  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#8b5cf6')

  const [editingCategory, setEditingCategory] = useState<{
    id: number
    name: string
    color: string
  } | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#8b5cf6')

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  const { data: listsData } = useQuery({ queryKey: ['lists'], queryFn: () => api.lists.list() })
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    staleTime: 0,
  })

  const lists = listsData?.docs ?? []
  const allTasks = (tasksData?.docs ?? []) as Task[]
  const defaultList = lists.find((l) => l.isDefault)
  const customLists = lists.filter((l) => !l.isDefault)

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    await createMutation.mutateAsync({ name: newCategoryName.trim(), color: newCategoryColor })
    setNewCategoryName('')
    setNewCategoryColor('#8b5cf6')
    setShowNewCategory(false)
  }

  const handleStartEdit = (cat: { id: number; name: string; color: string }) => {
    setEditingCategory(cat)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  const handleSaveEdit = async () => {
    if (!editingCategory || !editName.trim()) return
    await updateMutation.mutateAsync({
      id: editingCategory.id,
      data: { name: editName.trim(), color: editColor },
    })
    setEditingCategory(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-80 rounded-2xl border border-border/60 bg-background p-5 shadow-xl space-y-4">
            <p className="text-sm font-semibold text-foreground">Edit category</p>
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Category name..."
              className="w-full h-9 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
              }}
            />
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Color
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditColor(c)}
                    className="h-6 w-6 rounded-full transition-all hover:scale-110"
                    style={{
                      backgroundColor: c,
                      ...(editColor === c && { outline: `2px solid ${c}`, outlineOffset: '2px' }),
                    }}
                  />
                ))}
                <div className="relative">
                  <div
                    className="h-6 w-6 rounded-full border-2 border-dashed border-border/60 cursor-pointer"
                    style={{
                      backgroundColor: PRESET_COLORS.includes(editColor)
                        ? 'transparent'
                        : editColor,
                    }}
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editName.trim() || updateMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background disabled:opacity-40"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="rounded-xl border border-border/60 px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and all calendar
              events associated with it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} variant="destructive">
              Delete category & events
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                        {customLists.map((list) => (
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
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

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
                          <SidebarMenuSubButton asChild isActive={isActive('/habits')}>
                            <Link href={nav('/habits')}>
                              <Flame className="h-3.5 w-3.5" />
                              Habits
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive('/habits-analytics')}>
                            <Link href={nav('/habits-analytics')}>
                              <BarChart2 className="h-3.5 w-3.5" />
                              Analytics
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                <Collapsible asChild className="group/calendar" disabled={isCollapsed}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Calendar"
                        className={cn(isCollapsed && 'pointer-events-none')}
                      >
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        <span>Calendar</span>
                        <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=closed]/calendar:-rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive('/calendar')}>
                            <Link href={nav('/calendar')}>
                              <CalendarDays className="h-3.5 w-3.5" />
                              Open calendar
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <div className="my-1.5 border-t border-border/40 mx-2" />

                        {categories.map((cat) => {
                          const isVisible = !hiddenCategories.has(cat.id)
                          return (
                            <SidebarMenuSubItem key={cat.id}>
                              <div className="flex items-center gap-2 px-2 py-1 rounded-md group/cat hover:bg-sidebar-accent transition-colors">
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(cat.id)}
                                  className={cn(
                                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                                    isVisible
                                      ? 'border-transparent'
                                      : 'border-border/60 bg-background',
                                  )}
                                  style={
                                    isVisible
                                      ? { backgroundColor: cat.color, borderColor: cat.color }
                                      : undefined
                                  }
                                >
                                  {isVisible && (
                                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                  )}
                                </button>
                                <span
                                  className={cn(
                                    'flex-1 truncate text-xs font-medium',
                                    isVisible ? 'text-foreground' : 'text-muted-foreground/50',
                                  )}
                                >
                                  {cat.name}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="opacity-0 group-hover/cat:opacity-100 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-all"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" side="right" className="w-36">
                                    <DropdownMenuItem
                                      onClick={() => handleStartEdit(cat)}
                                      className="gap-2 text-xs cursor-pointer"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setDeleteTarget({ id: cat.id, name: cat.name })
                                      }
                                      className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </SidebarMenuSubItem>
                          )
                        })}

                        {showNewCategory ? (
                          <SidebarMenuSubItem>
                            <div className="mx-2 rounded-xl border border-border/50 bg-muted/20 p-2.5 space-y-2">
                              <input
                                autoFocus
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Category name..."
                                className="w-full h-7 rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCreateCategory()
                                }}
                              />
                              <div className="flex flex-wrap gap-1">
                                {PRESET_COLORS.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setNewCategoryColor(c)}
                                    className="h-4 w-4 rounded-full transition-all hover:scale-110"
                                    style={{
                                      backgroundColor: c,
                                      ...(newCategoryColor === c && {
                                        outline: `2px solid ${c}`,
                                        outlineOffset: '2px',
                                      }),
                                    }}
                                  />
                                ))}
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={handleCreateCategory}
                                  disabled={!newCategoryName.trim() || createMutation.isPending}
                                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-foreground px-2 py-1 text-[10px] font-semibold text-background disabled:opacity-40"
                                >
                                  {createMutation.isPending ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                  ) : (
                                    <Check className="h-2.5 w-2.5" />
                                  )}
                                  Create
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowNewCategory(false)
                                    setNewCategoryName('')
                                  }}
                                  className="rounded-lg border border-border/60 px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </SidebarMenuSubItem>
                        ) : (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              onClick={() => setShowNewCategory(true)}
                              className="text-muted-foreground/60"
                            >
                              <Plus className="h-3 w-3" />
                              New calendar
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )}
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
