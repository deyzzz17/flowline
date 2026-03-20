'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from '@/lib/auth-client'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ElementType
  label: string
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
        ${
          isActive
            ? 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const { data: session, isPending } = useSession()
  const user = session?.user

  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-border/60 bg-background md:flex">
      <div className="flex flex-1 flex-col justify-between p-3">
        <nav className="space-y-1">
          <NavItem href="/lists" icon={ClipboardList} label="Tasks" />
        </nav>

        <div className="border-t border-border/50 pt-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
          >
            {isPending ? (
              <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
            ) : (
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
                <AvatarFallback className="bg-linear-to-br from-violet-500 to-purple-600 text-[10px] font-bold text-white">
                  {user?.name ? getInitials(user.name) : <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
            )}
            Profile
          </Link>
        </div>
      </div>
    </aside>
  )
}
