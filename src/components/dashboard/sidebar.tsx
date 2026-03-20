'use client'

import { ClipboardList } from 'lucide-react'
import { NavItem } from './nav-item'
import { SidebarProfile } from './sidebar-profile'

export function Sidebar() {
  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-border/60 bg-background md:flex">
      <div className="flex flex-1 flex-col justify-between p-3">
        <nav className="space-y-1">
          <NavItem href="/lists" icon={ClipboardList} label="Tasks" />
        </nav>
        <SidebarProfile />
      </div>
    </aside>
  )
}
