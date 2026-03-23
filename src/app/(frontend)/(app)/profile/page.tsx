import { requireAuth } from '@/lib/require-auth'
import { ProfileForm } from '@/components/profile/profile-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage() {
  const session = await requireAuth()
  const user = session.user

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
      <section className="mt-10 mb-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Account
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </section>

      <ProfileForm
        initialName={user?.name ?? ''}
        initialEmail={user?.email ?? ''}
        initialImage={user?.image ?? null}
        isEmailVerified={(user as any).emailVerified ?? false}
      />
    </div>
  )
}
