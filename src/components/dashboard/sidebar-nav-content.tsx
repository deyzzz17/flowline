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
  ChevronRight,
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

interface SidebarNavContentProps {
  onNavigate?: () => void
}

export function SidebarNavContent({ onNavigate }: SidebarNavContentProps) {
  const pathname = usePathname()
  const { feedbackOpen, setFeedbackOpen } = useSidebarFooter()
  const { categories, createMutation, deleteMutation } = useCalendarCategories()
  const { hiddenCategories, toggleCategory } = useCalendarFilter()

  const [listsOpen, setListsOpen] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [timerOpen, setTimerOpen] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#8b5cf6')

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

  const isActive = (href: string) => pathname === href

  const navLink = (href: string) => ({ href, onClick: onNavigate })

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    await createMutation.mutateAsync({ name: newCategoryName.trim(), color: newCategoryColor })
    setNewCategoryName('')
    setNewCategoryColor('#8b5cf6')
    setShowNewCategory(false)
  }

  return (
    <>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />

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
              {listsOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {listsOpen && (
              <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border/50 pl-3">
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
                {customLists.map((list) => (
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
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setCalendarOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 shrink-0" />
                Calendar
              </div>
              {calendarOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {calendarOpen && (
              <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border/50 pl-3">
                <Link
                  {...navLink('/calendar')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive('/calendar')
                      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  Open calendar
                </Link>
                <div className="my-1.5 border-t border-border/40" />
                {categories.map((cat) => {
                  const isVisible = !hiddenCategories.has(cat.id)
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 rounded-xl px-3 py-1.5 group/cat hover:bg-muted/40 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                          isVisible ? 'border-transparent' : 'border-border/60 bg-background',
                        )}
                        style={
                          isVisible
                            ? { backgroundColor: cat.color, borderColor: cat.color }
                            : undefined
                        }
                      >
                        {isVisible && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </button>
                      <span
                        className={cn(
                          'flex-1 truncate text-xs font-medium',
                          isVisible ? 'text-foreground' : 'text-muted-foreground/50',
                        )}
                      >
                        {cat.name}
                      </span>
                      {!cat.isDefault && (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(cat.id)}
                          className="opacity-0 group-hover/cat:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )
                })}
                {showNewCategory ? (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5 space-y-2 mt-1">
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
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-all"
                  >
                    <Plus className="h-3 w-3 shrink-0" />
                    New calendar
                  </button>
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
              {timerOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
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
                  {...navLink('/timer/analytics')}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive('/timer/analytics')
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
