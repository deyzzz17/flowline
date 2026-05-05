'use client'

import {
  Home,
  Sun,
  RefreshCw,
  ClipboardList,
  Plus,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  HelpCircle,
  Timer,
  BarChart2,
  CalendarDays,
  X,
  Check,
  Loader2,
} from 'lucide-react'
import { NavItem } from './nav-item'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useActiveNav } from '@/hooks/dashboard/use-active-nav'
import { useSidebarFooter } from '@/hooks/sidebar/use-sidebar-footer'
import { useCalendarCategories } from '@/hooks/calendar/use-calendar-categories'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Task } from '@/payload-types'
import { SidebarNewsletter } from './sidebar-newsletter'
import { FeedbackDialog } from '../support/feedback-dialog'
import { useCalendarFilter } from '../calendar/calendar-filter-context'

interface SidebarContentProps {
  onNavigate?: () => void
}

function getListUrgency(tasks: Task[]): 'red' | 'orange' | null {
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  const twoDaysMs = 2 * oneDayMs
  let hasOrange = false
  for (const task of tasks) {
    if (task.status !== 'active' || !task.dueDate) continue
    const diff = new Date(task.dueDate).getTime() - now
    if (diff <= oneDayMs) return 'red'
    if (diff <= twoDaysMs) hasOrange = true
  }
  return hasOrange ? 'orange' : null
}

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

export const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  const [listsOpen, setListsOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [timerOpen, setTimerOpen] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#8b5cf6')
  const { hiddenCategories, toggleCategory } = useCalendarFilter()

  const { feedbackOpen, setFeedbackOpen } = useSidebarFooter()
  const { categories, createMutation, deleteMutation } = useCalendarCategories()

  const { data: listsData } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.lists.list(),
  })
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

      <div className="flex flex-1 flex-col p-3 h-full overflow-hidden">
        <nav className="flex-1 space-y-1 overflow-y-auto min-h-0">
          <NavItem href="/dashboard" icon={Home} label="Home" onNavigate={onNavigate} />

          <div>
            <button
              type="button"
              onClick={() => setListsOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
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
                <NavItem href="/lists/today" icon={Sun} label="Today" onNavigate={onNavigate} />
                <NavItem
                  href="/lists/recurring"
                  icon={RefreshCw}
                  label="Recurring"
                  onNavigate={onNavigate}
                />
                <div className="my-1.5 border-t border-border/40" />
                {defaultList && (
                  <ListNavItem
                    href={`/lists/${defaultList.slug}`}
                    label={defaultList.name}
                    color={defaultList.category?.color ?? '#8b5cf6'}
                    urgency={getListUrgency(tasksByList[defaultList.id] ?? [])}
                    onNavigate={onNavigate}
                  />
                )}
                {customLists.map((list) => (
                  <ListNavItem
                    key={list.id}
                    href={`/lists/${list.slug}`}
                    label={list.name}
                    color={list.category?.color ?? '#8b5cf6'}
                    urgency={getListUrgency(tasksByList[list.id] ?? [])}
                    onNavigate={onNavigate}
                  />
                ))}
                <Link
                  href="/lists/new-list"
                  onClick={onNavigate}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground/60 transition-all duration-200 hover:bg-muted hover:text-foreground"
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
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
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
                <NavItem
                  href="/calendar"
                  icon={CalendarDays}
                  label="Open calendar"
                  onNavigate={onNavigate}
                />

                <div className="my-1.5 border-t border-border/40" />

                {categories.map((cat) => {
                  const isVisible = !hiddenCategories.has(cat.id)
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 rounded-xl px-3 py-1.5 group hover:bg-muted/40 transition-colors"
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
                          'flex-1 truncate text-xs font-medium transition-colors',
                          isVisible ? 'text-foreground' : 'text-muted-foreground/50',
                        )}
                      >
                        {cat.name}
                      </span>
                      {!cat.isDefault && (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(cat.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all"
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
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-foreground px-2 py-1 text-[10px] font-semibold text-background disabled:opacity-40 transition-all hover:bg-foreground/80"
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
                        className="rounded-lg border border-border/60 px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground/60 transition-all hover:bg-muted hover:text-foreground"
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
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
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
                <NavItem href="/timer" icon={Timer} label="Timer" onNavigate={onNavigate} />
                <NavItem
                  href="/timer/analytics"
                  icon={BarChart2}
                  label="Analytics"
                  onNavigate={onNavigate}
                />
              </div>
            )}
          </div>
        </nav>

        <div className="mt-4 space-y-1 shrink-0">
          <SidebarNewsletter />
          <div className="border-t border-border/40 pt-2 space-y-0.5">
            <Link
              href="/support"
              onClick={onNavigate}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              Support
            </Link>
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
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

function ListNavItem({
  href,
  label,
  color,
  urgency,
  onNavigate,
}: {
  href: string
  label: string
  color: string
  urgency: 'red' | 'orange' | null
  onNavigate?: () => void
}) {
  const isActive = useActiveNav(href)
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 truncate">{label}</span>
      {urgency && (
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            urgency === 'red' ? 'bg-destructive' : 'bg-orange-500',
          )}
        />
      )}
    </Link>
  )
}
