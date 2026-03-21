'use client'

import Link from 'next/link'
import { LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut, useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const UserDropdown = () => {
  const { data: session, isPending } = useSession()
  const user = session?.user
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
  }

  if (isPending) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
            <AvatarFallback className="bg-linear-to-br from-violet-500 to-purple-600 text-xs font-bold text-white">
              {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
            <AvatarFallback className="bg-linear-to-br from-violet-500 to-purple-600 text-xs font-bold text-white">
              {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name ?? 'Unknown'}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
          <Link href="/dashboard" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
