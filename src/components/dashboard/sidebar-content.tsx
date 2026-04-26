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
} from 'lucide-react'
import { NavItem } from './nav-item'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useActiveNav } from '@/hooks/dashboard/use-active-nav'
import { useSidebarFooter } from '@/hooks/sidebar/use-sidebar-footer'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Task } from '@/payload-types'
import { SidebarNewsletter } from './sidebar-newsletter'
import { FeedbackDialog } from '../support/feedback-dialog'

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

export const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  const [listsOpen, setListsOpen] = useState(true)
  const { feedbackOpen, setFeedbackOpen } = useSidebarFooter()

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

  return (
    <>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      <div className="flex flex-1 flex-col p-3">
        {/* Navigation — scrollable */}
        <nav className="flex-1 space-y-1">
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
        </nav>

        {/* Footer — newsletter + support/feedback, fixe en bas */}
        <div className="mt-4 space-y-1">
          {/* Newsletter — s'affiche au-dessus du footer */}
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
