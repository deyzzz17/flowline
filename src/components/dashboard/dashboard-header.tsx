'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function getFirstName(name?: string | null): string {
  if (!name) return ''
  return name.split(' ')[0]
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const firstName = getFirstName(user?.name)

  return (
    <section className="mb-6 mt-8 flex items-start justify-between gap-4">
      <div>
        <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
          Dashboard
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {getGreeting()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{formatDate()}</p>
      </div>
      <Link href="/profile">
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0 mt-1">
          <Settings className="h-3.5 w-3.5" />
          Edit profile
        </Button>
      </Link>
    </section>
  )
}
