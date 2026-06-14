'use client'

import Link from 'next/link'
import { ModeToggle } from '@/components/theme/mode-toggle'
import { FlowlineLogo } from '../header/flowline-logo'
import { ExternalLink, Menu, X } from 'lucide-react'

interface DocsNavProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function DocsNav({ sidebarOpen, onToggleSidebar }: DocsNavProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex md:hidden items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link href="/docs" className="flex items-center gap-2.5">
            <FlowlineLogo />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground" translate="no">
                Flowline
              </span>
              <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Docs
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Getting started', href: '/docs/getting-started' },
              { label: 'Features', href: '/docs/tasks' },
              { label: 'FAQ', href: '/docs/faq' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            Open app
            <ExternalLink className="h-3 w-3" />
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
