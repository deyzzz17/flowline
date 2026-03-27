import React from 'react'
import { ModeToggle } from '@/components/theme/mode-toggle'
import { FlowlineLogo } from '@/components/header/flowline-logo'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileSidebarTrigger } from '@/components/dashboard/mobile-side-bar-trigger'
import Link from 'next/link'
import { UserDropdown } from '@/components/dashboard/user-dropdown'
import { Providers } from '../../../components/providers/providers'
import { UserProvider } from '@/contexts/user-context'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { api } from '@/api'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user

  const cookieStore = await cookies()
  const lastSync = cookieStore.get('tasks_last_sync')?.value
  const userTimezone = user?.timezone ?? 'UTC'
  const today = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  if (lastSync !== today && user?.id) {
    await api.tasks.syncTasks()
    cookieStore.set('tasks_last_sync', today, {
      httpOnly: true,
      maxAge: 60 * 60 * 24,
    })
  }

  return (
    <>
      <Providers>
        <UserProvider
          initialUser={{
            name: user?.name ?? '',
            email: user?.email ?? '',
            image: user?.image ?? null,
          }}
        >
          <div className="flex h-screen flex-col overflow-hidden">
            <header className="z-50 w-full shrink-0 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
              <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                <Link href="/dashboard" className="group flex items-center gap-3">
                  <FlowlineLogo />
                  <span className="text-[17px] font-bold tracking-tight text-foreground transition-colors group-hover:text-foreground/80">
                    Flowline
                  </span>
                </Link>
                <div className="flex items-center gap-2 sm:gap-3">
                  <ModeToggle />
                  <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
                  <MobileSidebarTrigger />
                  <UserDropdown />
                </div>
              </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        </UserProvider>
      </Providers>
    </>
  )
}
