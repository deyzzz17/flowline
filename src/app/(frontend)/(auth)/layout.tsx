import React from 'react'
import '../styles.css'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { AuthButtons } from '@/components/header/auth-button'
import { ModeToggle } from '@/components/theme/mode-toggle'
import { FlowlineLogo } from '@/components/header/flowline-logo'

export const metadata = {
  description: 'Flowline - Your productivity OS',
  title: 'Flowline',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
              <a href="/" className="group flex items-center gap-3">
                <FlowlineLogo />
                <span className="text-[17px] font-bold tracking-tight text-foreground transition-colors group-hover:text-foreground/80">
                  Flowline
                </span>
              </a>

              <div className="flex items-center gap-2 sm:gap-3">
                <ModeToggle />
                <AuthButtons />
              </div>
            </div>
          </header>

          <main className="h-[calc(100dvh-4rem)] w-full overflow-hidden">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
