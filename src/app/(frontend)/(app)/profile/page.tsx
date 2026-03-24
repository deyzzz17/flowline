import { requireAuth } from '@/lib/require-auth'
import { ProfileForm } from '@/components/profile/profile-form'
import { Orb } from '@/components/home/orb'

export default async function ProfilePage() {
  const session = await requireAuth()
  const user = session.user

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Orb className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500 opacity-5 dark:opacity-10 blur-3xl animate-pulse" />
      <Orb className="pointer-events-none fixed bottom-0 left-1/4 h-64 w-64 rounded-full bg-indigo-500 opacity-5 dark:opacity-10 blur-3xl animate-pulse" />
      <ProfileForm
        initialName={user?.name ?? ''}
        initialEmail={user?.email ?? ''}
        initialImage={user?.image ?? null}
        isEmailVerified={user.emailVerified ?? false}
      />
    </div>
  )
}
