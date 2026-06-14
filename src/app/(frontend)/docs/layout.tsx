import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { DocsShell } from '@/components/docs/docs-shell'

export const metadata: Metadata = {
  title: 'Flowline Docs',
  description: 'Complete documentation for Flowline — your productivity OS.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-background text-foreground">
        <DocsShell>{children}</DocsShell>
      </div>
    </ThemeProvider>
  )
}
