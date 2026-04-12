import { requireGuest } from '@/lib/require-auth'

export const GuestRoute = async ({ children }: { children: React.ReactNode }) => {
  await requireGuest()

  return children
}
