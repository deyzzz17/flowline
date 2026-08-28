'use client'

import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

function WorkspaceAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400',
        className,
      )}
    >
      <Building2 className="h-4 w-4" />
    </span>
  )
}

function WorkspaceMenuContent({ align }: { align?: 'start' | 'center' | 'end' }) {
  return (
    <DropdownMenuContent align={align ?? 'start'} className="w-56">
      <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Workspaces
      </DropdownMenuLabel>
      <DropdownMenuItem className="gap-2 text-sm cursor-default">
        <WorkspaceAvatar className="size-6" />
        <span className="flex-1 truncate">Personal</span>
        <Check className="h-3.5 w-3.5 text-violet-500" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

export function WorkspaceSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all"
        >
          <WorkspaceAvatar className="size-6" />
          <span className="flex-1 truncate text-left">Personal</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <WorkspaceMenuContent />
    </DropdownMenu>
  )
}

export function SidebarWorkspaceSwitcher() {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" tooltip="Personal">
            <WorkspaceAvatar className="size-8 rounded-md" />
            <span className="flex-1 truncate text-left font-semibold">Personal</span>
            <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <WorkspaceMenuContent align="start" />
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
