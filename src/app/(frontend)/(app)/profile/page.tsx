import { requireAuth } from '@/lib/require-auth'
import { ProfileForm } from '@/components/profile/profile-form'

export default async function ProfilePage() {
  const session = await requireAuth()
  const user = session.user

  return (
    <ProfileForm
      initialName={user?.name ?? ''}
      initialEmail={user?.email ?? ''}
      initialImage={user?.image ?? null}
      isEmailVerified={user.emailVerified ?? false}
    />
  )
}
