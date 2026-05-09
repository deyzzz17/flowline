'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'

export function MobileSidebarTrigger() {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label="Open menu"
    >
      <Menu className="h-4 w-4" />
    </button>
  )
}
