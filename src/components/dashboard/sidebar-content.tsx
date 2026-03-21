'use client'

import { ClipboardList } from 'lucide-react'
import { NavItem } from './nav-item'
import { SidebarProfile } from './sidebar-profile'

interface SidebarContentProps {
  onNavigate?: () => void
}

export const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  return (
    <div className="flex flex-1 flex-col justify-between p-3">
      <nav className="space-y-1">
        <NavItem href="/lists" icon={ClipboardList} label="Tasks" onNavigate={onNavigate} />
      </nav>
      <SidebarProfile onNavigate={onNavigate} />
    </div>
  )
}
