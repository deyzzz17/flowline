import React from 'react'
import { ModeToggle } from '@/components/theme/mode-toggle'
import { FlowlineLogo } from '@/components/header/flowline-logo'
import { AuthButtons } from '@/components/header/auth-button'
import Link from 'next/link'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" className="group flex items-center gap-3">
            <FlowlineLogo />
            <span className="text-[17px] font-bold tracking-tight text-foreground transition-colors group-hover:text-foreground/80">
              Flowline
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ModeToggle />
            <AuthButtons />
          </div>
        </div>
      </header>

      <main className="w-full">{children}</main>
    </>
  )
}
