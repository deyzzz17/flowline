import { requireAuth } from '@/lib/require-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Camera, CheckCircle2, Mail, ShieldAlert, User } from 'lucide-react'
import Link from 'next/link'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default async function ProfilePage() {
  const session = await requireAuth()
  const user = session.user

  const isEmailVerified = user.emailVerified ?? false

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
      <section className="mb-8 mt-10">
        <Link
          href="/dashboard"
          className="mb-6 flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
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

      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Profile picture</h2>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
                <AvatarFallback className="bg-linear-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white">
                  {user?.name ? getInitials(user.name) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                aria-label="Change photo"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{user?.name ?? 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">
                Click on the avatar to change your photo.
              </p>
              <p className="text-xs text-muted-foreground/60">JPG, PNG or GIF — max 2MB</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Display name</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
              <User className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name ?? 'No name set'}
              </p>
              <p className="text-xs text-muted-foreground">Your display name</p>
            </div>
            <button className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground">
              Edit
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Email address</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.email ?? ''}</p>
              {isEmailVerified ? (
                <div className="mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Verified
                  </span>
                </div>
              ) : (
                <div className="mt-0.5 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Not verified
                  </span>
                </div>
              )}
            </div>

            {!isEmailVerified && (
              <button className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-all hover:bg-amber-500/20 dark:text-amber-400">
                Verify email
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Danger zone</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button className="rounded-xl border border-destructive/40 bg-background px-4 py-2 text-xs font-semibold text-destructive transition-all hover:bg-destructive hover:text-white">
            Delete account
          </button>
        </div>
      </div>
    </div>
  )
}
