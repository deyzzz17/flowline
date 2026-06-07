'use client'

import Link from 'next/link'
import { BookOpen, ExternalLink } from 'lucide-react'
import { ModeToggle } from '../theme/mode-toggle'

export function DocsNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/docs" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
              <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
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
              { label: 'Getting started', href: '/docs' },
              { label: 'Features', href: '/docs/tasks' },
              { label: 'FAQ', href: '/support' },
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
