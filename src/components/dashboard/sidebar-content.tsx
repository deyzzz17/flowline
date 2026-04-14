'use client'

import { Home, Sun, RefreshCw, ClipboardList, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { NavItem } from './nav-item'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useActiveNav } from '@/hooks/dashboard/use-active-nav'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface SidebarContentProps {
  onNavigate?: () => void
}

export const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  const [listsOpen, setListsOpen] = useState(true)

  const { data } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.lists.list(),
  })

  const lists = data?.docs ?? []
  const defaultList = lists.find((l) => l.isDefault)
  const customLists = lists.filter((l) => !l.isDefault)

  return (
    <div className="flex flex-1 flex-col p-3">
      <nav className="space-y-1">
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
                  href={`/lists/${defaultList.id}`}
                  label={defaultList.name}
                  color={defaultList.category?.color ?? '#8b5cf6'}
                  onNavigate={onNavigate}
                />
              )}

              {customLists.map((list) => (
                <ListNavItem
                  key={list.id}
                  href={`/lists/${list.id}`}
                  label={list.name}
                  color={list.category?.color ?? '#8b5cf6'}
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
    </div>
  )
}

function ListNavItem({
  href,
  label,
  color,
  onNavigate,
}: {
  href: string
  label: string
  color: string
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
      {label}
    </Link>
  )
}
