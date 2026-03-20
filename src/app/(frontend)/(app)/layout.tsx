import React from 'react'
import '../styles.css'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { ModeToggle } from '@/components/theme/mode-toggle'
import { FlowlineLogo } from '@/components/header/flowline-logo'
import { Sidebar } from '@/components/dashboard/sidebar'

import Link from 'next/link'
import { UserDropdown } from '@/components/dashboard/user-dropdown'

export const metadata = {
  description: 'Flowline - Your productivity OS',
  title: 'Flowline',
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
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
                  <UserDropdown />
                </div>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
