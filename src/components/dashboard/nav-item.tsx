'use client'
import Link from 'next/link'
import { useActiveNav } from '@/hooks/dashboard/use-active-nav'

interface NavItemProps {
  href: string
  icon: React.ElementType
  label: string
}

export function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const isActive = useActiveNav(href)

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
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
