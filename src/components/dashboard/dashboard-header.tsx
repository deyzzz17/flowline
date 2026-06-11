'use client'

import Link from 'next/link'
import { Settings, User, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from '@/lib/auth-client'
import { EmailVerificationBanner } from '@/components/dashboard/email-verification-banner'

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

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return parts[0][0].toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DashboardHeader() {
  const { data: session } = useSession()
  const user = session?.user
  const isEmailVerified = user?.emailVerified ?? true
  const firstName = getFirstName(user?.name)
  const initials = getInitials(user?.name, user?.email)

  return (
    <section className="mb-6 mt-8">
      {user?.email && (
        <EmailVerificationBanner email={user.email} isEmailVerified={isEmailVerified} />
      )}

      <div className="flex items-start justify-between gap-4">
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

        <div className="flex items-center gap-2.5 shrink-0 mt-1">
          <Link href="/profile">
            <div className="relative">
              <Avatar className="h-9 w-9 cursor-pointer ring-offset-background transition-opacity hover:opacity-80">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
                <AvatarFallback className="bg-violet-500/10 text-xs font-semibold text-violet-600 dark:text-violet-400">
                  {user?.name ? initials : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              {!isEmailVerified && (
                <div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 ring-2 ring-background flex items-center justify-center">
                  <ShieldAlert className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
          </Link>
          <Link href="/profile">
            <Button
              variant="outline"
              size="sm"
              className={
                !isEmailVerified
                  ? 'gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400'
                  : 'gap-1.5'
              }
            >
              {!isEmailVerified ? (
                <>
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Verify email
                </>
              ) : (
                <>
                  <Settings className="h-3.5 w-3.5" />
                  Edit profile
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
