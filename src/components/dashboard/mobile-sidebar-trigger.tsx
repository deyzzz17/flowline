'use client'

import { useState } from 'react'
import { PanelLeft } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { SidebarNavContent } from './sidebar-nav-content'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Open menu"
      >
        <PanelLeft className="h-4 w-4 shrink-0" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
          <VisuallyHidden.Root>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>App navigation menu</SheetDescription>
          </VisuallyHidden.Root>
          <div className="flex h-16 items-center border-b border-border/60 px-4 shrink-0">
            <span className="text-[17px] font-bold tracking-tight text-foreground">Flowline</span>
          </div>
          <div className="h-[calc(100%-4rem)]">
            <SidebarNavContent onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
