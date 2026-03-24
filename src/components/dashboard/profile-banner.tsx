'use client'

import { useSession } from '@/lib/auth-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Pencil } from 'lucide-react'
import Link from 'next/link'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileBanner() {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <section className="mb-8 border-b border-border/50 py-8">
      <div className="flex items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
              <AvatarFallback className="bg-linear-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white">
                {user?.name ? getInitials(user.name) : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {user?.name ?? 'Unknown'}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{user?.email ?? ''}</p>
          </div>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit profile
        </Link>
      </div>
    </section>
  )
}
