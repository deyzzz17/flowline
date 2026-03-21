'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCurrentUser } from '@/hooks/dashboard/use-current-user'

interface SidebarProfileProps {
  onNavigate?: () => void
}

export const SidebarProfile = ({ onNavigate }: SidebarProfileProps) => {
  const { isPending, initials, image, name } = useCurrentUser()

  return (
    <div className="border-t border-border/50 pt-3">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
      >
        {isPending ? (
          <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
        ) : (
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={image} alt={name ?? ''} />
            <AvatarFallback className="bg-linear-to-br from-violet-500 to-purple-600 text-[10px] font-bold text-white">
              {name ? initials : <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
        )}
        Profile
      </Link>
    </div>
  )
}
