'use client'

import { useState } from 'react'
import { ClipboardList, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { NavItem } from './nav-item'
import { SidebarProfile } from './sidebar-profile'

function SidebarContent() {
  return (
    <div className="flex flex-1 flex-col justify-between p-3">
      <nav className="space-y-1">
        <NavItem href="/lists" icon={ClipboardList} label="Tasks" />
      </nav>
      <SidebarProfile />
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-border/60 bg-background md:flex">
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-64 p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="flex h-16 items-center border-b border-border/60 px-4">
          <span className="text-[17px] font-bold tracking-tight text-foreground">Flowline</span>
        </div>

        <div className="flex flex-1 flex-col justify-between h-[calc(100%-4rem)]">
          <SidebarContent />
        </div>
      </SheetContent>
    </Sheet>
  )
}
