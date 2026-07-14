import { requireAuth } from '@/lib/require-auth'
import { ProfileForm } from '@/components/profile/profile-form'
import { Orb } from '@/components/home/orb'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getBillingInfo } from '@/api/billing/actions'

export default async function ProfilePage() {
  const [session, accounts, billing] = await Promise.all([
    requireAuth(),
    auth.api.listUserAccounts({ headers: await headers() }).catch(() => []),
    getBillingInfo(),
  ])

  const user = session.user
  const hasPassword = (accounts as any[]).some((a) => a.providerId === 'credential')

  return (
    <div className="relative">
      <Orb className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500 opacity-5 dark:opacity-10 blur-3xl animate-pulse" />
      <Orb className="pointer-events-none fixed -bottom-32 -right-32 h-64 w-64 rounded-full bg-indigo-500 opacity-5 dark:opacity-10 blur-3xl animate-pulse" />
      <ProfileForm
        initialName={user?.name ?? ''}
        initialEmail={user?.email ?? ''}
        initialImage={user?.image ?? null}
        isEmailVerified={user.emailVerified ?? false}
        hasPassword={hasPassword}
        billing={billing}
      />
    </div>
  )
}
