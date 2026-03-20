'use client'
import { useSession } from '@/lib/auth-client'

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
  const { data: session, isPending } = useSession()
  const user = session?.user ?? null

  return {
    user,
    isPending,
    initials: getInitials(user?.name),
    image: user?.image ?? undefined,
    name: user?.name ?? null,
    email: user?.email ?? null,
  }
}
