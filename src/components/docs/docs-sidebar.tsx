'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  CheckSquare,
  Flame,
  CalendarDays,
  Timer,
  LayoutDashboard,
  BarChart2,
  Settings,
  Zap,
  HelpCircle,
} from 'lucide-react'

const NAV = [
  {
    group: 'Overview',
    items: [
      { label: 'Introduction', href: '/docs', icon: BookOpen },
      { label: 'Getting started', href: '/docs/getting-started', icon: Zap },
    ],
  },
  {
    group: 'Features',
    items: [
      { label: 'Dashboard', href: '/docs/dashboard', icon: LayoutDashboard },
      { label: 'Tasks & Lists', href: '/docs/tasks', icon: CheckSquare },
      { label: 'Habits', href: '/docs/habits', icon: Flame },
      { label: 'Calendar', href: '/docs/calendar', icon: CalendarDays },
      { label: 'Focus Timer', href: '/docs/timer', icon: Timer },
      { label: 'Analytics', href: '/docs/analytics', icon: BarChart2 },
    ],
  },
  {
    group: 'Account',
    items: [{ label: 'Profile & settings', href: '/docs/settings', icon: Settings }],
  },
  {
    group: 'Help',
    items: [{ label: 'FAQ', href: '/docs/faq', icon: HelpCircle }],
  },
]

export function DocsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 border-r border-border/60 bg-background overflow-y-auto">
      <div className="p-4 space-y-6">
        {NAV.map((section) => (
          <div key={section.group}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {section.group}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
