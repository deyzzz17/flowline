'use client'
import { useUser } from '@/contexts/user-context'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function useCurrentUser() {
  const { user } = useUser()

  return {
    user,
    initials: getInitials(user?.name),
    image: user?.image ?? undefined,
    name: user?.name ?? null,
    email: user?.email ?? null,
  }
}
