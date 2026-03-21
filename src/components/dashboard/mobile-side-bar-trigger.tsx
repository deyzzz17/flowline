'use client'

import { useManageDisplay } from '@/hooks/header/use-manage-auth'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { Menu } from 'lucide-react'
import { SidebarContent } from './sidebar-content'

export const MobileSidebarTrigger = () => {
  const { open, change } = useManageDisplay()

  return (
    <Sheet open={open} onOpenChange={change}>
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
          <SidebarContent onNavigate={change} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
