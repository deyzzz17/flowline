import { requireAuth } from '@/lib/require-auth'
import { ProfileForm } from '@/components/profile/profile-form'
import { Orb } from '@/components/home/orb'
import { ProtectedRoute } from '@/components/route/protected-route'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function ProfilePage() {
  const session = await requireAuth()
  const user = session.user

  let hasPassword = false
  try {
    const accounts = await auth.api.listUserAccounts({ headers: await headers() })
    console.log('accounts:', JSON.stringify(accounts))
    hasPassword =
      !accounts.some((a: any) => a.provider === 'google') ||
      accounts.some((a: any) => a.provider === 'credential' || a.provider === 'credentials')
  } catch {
    hasPassword = true
  }

  return (
    <ProtectedRoute>
      <div className="relative">
        <Orb className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500 opacity-5 dark:opacity-10 blur-3xl animate-pulse" />
        <Orb className="pointer-events-none fixed -bottom-32 -right-32 h-64 w-64 rounded-full bg-indigo-500 opacity-5 dark:opacity-10 blur-3xl animate-pulse" />
        <ProfileForm
          initialName={user?.name ?? ''}
          initialEmail={user?.email ?? ''}
          initialImage={user?.image ?? null}
          isEmailVerified={user.emailVerified ?? false}
          hasPassword={hasPassword}
        />
      </div>
    </ProtectedRoute>
  )
}
