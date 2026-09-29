import { redirect } from 'next/navigation'
import { getSession } from './get-session'

export async function requireAuth() {
  const session = await getSession()
  // Not straight to /sign-in: a stale session cookie would make middleware.ts
  // bounce the visitor back here. This route clears it first.
  if (!session) redirect('/api/auth/session-expired')
  return session
}
