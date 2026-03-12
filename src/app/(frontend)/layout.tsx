import React from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { ModeToggle } from '@/components/mode-toggle'
import './styles.css'

export const metadata = {
  description: 'Flowline - Simple Task Management',
  title: 'Flowline',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container max-w-4xl mx-auto flex h-20 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black uppercase text-foreground transition-all">
                  Flowline<span className="text-blue-600 dark:text-blue-500 ml-1">.</span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <ModeToggle />
              </div>
            </div>
          </header>

          <main className="container max-w-4xl mx-auto p-4 md:p-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
