'use client'

import { useState } from 'react'
import { DocsNav } from './docs-nav'
import { DocsSidebar } from './docs-sidebar'

export function DocsShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <DocsNav
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
      <DocsSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="pt-14 md:pl-64">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
          {children}
        </div>
      </main>
    </>
  )
}