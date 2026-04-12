'use client'

import { ClipboardList, Home } from 'lucide-react'
import { NavItem } from './nav-item'

interface SidebarContentProps {
  onNavigate?: () => void
}

export const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  return (
    <div className="flex flex-1 flex-col p-3">
      <nav className="space-y-1">
        <NavItem href="/dashboard" icon={Home} label="Home" onNavigate={onNavigate} />
        <NavItem href="/lists" icon={ClipboardList} label="Tasks" onNavigate={onNavigate} />
      </nav>
    </div>
  )
}
