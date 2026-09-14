import React from 'react'
import { after } from 'next/server'
import { ModeToggle } from '@/components/theme/mode-toggle'
import { FlowlineLogo } from '@/components/header/flowline-logo'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { MobileSidebarTrigger } from '@/components/dashboard/mobile-sidebar-trigger'
import Link from 'next/link'
import { UserDropdown } from '@/components/dashboard/user-dropdown'
import { Providers } from '../../../components/providers/providers'
import { UserProvider } from '@/contexts/user-context'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { syncRecurringTasksForUser } from '@/api/tasks/actions'
import { checkListsCompliance } from '@/api/lists/actions'
import { checkSharedListsCompliance } from '@/api/list-members/actions'
import { checkTagsCompliance } from '@/api/tags/actions'
import { listWorkspaces, checkWorkspaceMembersCompliance } from '@/api/workspaces/actions'
import type { WorkspacesData } from '@/components/dashboard/workspace-switcher'
import { Toaster } from '@/components/ui/sonner'
import { NotificationsMenu } from '@/components/header/notifications-menu'
import { CalendarFilterProvider } from '@/components/calendar/calendar-filter-context'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TimerProvider } from '@/components/timer/timer-context'
import { GlobalTimerDialog } from '@/components/timer/global-timer-dialog'
import { AccountComplianceGate } from '@/components/lists/account-compliance-gate'
import { RestorePromptProvider } from '@/components/ui/restore-prompt-context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user

  let listsCompliance = null
  let sharedListsCompliance = null
  let tagsCompliance = null
  let workspaceMembersCompliance: Awaited<ReturnType<typeof checkWorkspaceMembersCompliance>> = []
  let initialWorkspaces: WorkspacesData | undefined

  if (user?.id) {
    // Runs after the response is sent instead of blocking this render — it
    // only flips recurring tasks active/inactive for a day-of-week change,
    // which doesn't need to finish before the page paints. Previously this
    // was `await`ed here, ahead of the Promise.all below, so it added a full
    // extra sequential DB round trip to every single navigation.
    after(() => syncRecurringTasksForUser())
    ;[listsCompliance, sharedListsCompliance, tagsCompliance, workspaceMembersCompliance, initialWorkspaces] =
      await Promise.all([
        checkListsCompliance(),
        checkSharedListsCompliance(),
        checkTagsCompliance(),
        checkWorkspaceMembersCompliance(),
        listWorkspaces(),
      ])
  }

  return (
    <Providers>
      <UserProvider
        key={user?.email ?? 'guest'}
        initialUser={{
          name: user?.name ?? '',
          email: user?.email ?? '',
          image: user?.image ?? null,
        }}
      >
        <CalendarFilterProvider>
          <TimerProvider>
            <RestorePromptProvider>
              <Toaster position="bottom-right" />
              <GlobalTimerDialog />
              <AccountComplianceGate
                initialListsCompliance={listsCompliance}
                initialSharedListsCompliance={sharedListsCompliance}
                initialTagsCompliance={tagsCompliance}
                initialWorkspaceMembersCompliance={workspaceMembersCompliance}
              />
              <div
                className="h-screen flex flex-col overflow-hidden"
                style={{ '--header-height': '4rem' } as React.CSSProperties}
              >
                <TooltipProvider>
                  <SidebarProvider
                    className="flex-1 flex flex-col min-h-0"
                    style={{ '--sidebar-width': '16rem' } as React.CSSProperties}
                  >
                    <header className="h-16 shrink-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
                      <div className="flex h-full items-center justify-between px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <MobileSidebarTrigger initialWorkspaces={initialWorkspaces} />
                          <Link href="/dashboard" className="group flex items-center gap-3">
                            <FlowlineLogo />
                            <span
                              translate="no"
                              className="text-[17px] font-bold tracking-tight text-foreground transition-colors group-hover:text-foreground/80"
                            >
                              Flowline
                            </span>
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <NotificationsMenu />
                          <ModeToggle />
                          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
                          <UserDropdown />
                        </div>
                      </div>
                    </header>
                    <div className="flex flex-1 min-h-0">
                      <div className="hidden md:flex">
                        <AppSidebar initialWorkspaces={initialWorkspaces} />
                      </div>
                      <SidebarInset className="flex-1 min-h-0 overflow-y-auto">
                        {children}
                      </SidebarInset>
                    </div>
                  </SidebarProvider>
                </TooltipProvider>
              </div>
            </RestorePromptProvider>
          </TimerProvider>
        </CalendarFilterProvider>
      </UserProvider>
    </Providers>
  )
}
