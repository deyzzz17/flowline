import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { DocsNav } from '@/components/docs/docs-nav'
import { DocsSidebar } from '@/components/docs/docs-sidebar'

export const metadata: Metadata = {
  title: 'Flowline Docs',
  description: 'Complete documentation for Flowline — your productivity OS.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-background text-foreground">
        <DocsNav />
        <div className="flex pt-14">
          <DocsSidebar />
          <main className="flex-1 min-w-0 ml-64">
            <div className="max-w-3xl mx-auto px-8 py-12">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}