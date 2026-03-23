'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, CheckCircle2, Loader2, Mail, ShieldAlert, User } from 'lucide-react'
import { cn } from '@/lib/utils'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface ProfileFormProps {
  initialName: string
  initialEmail: string
  initialImage: string | null
  isEmailVerified: boolean
}

export function ProfileForm({
  initialName,
  initialEmail,
  initialImage,
  isEmailVerified,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isDirty = name !== initialName

  const handleSave = async () => {
    if (!isDirty) return
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Profile picture</h2>
        <p className="mb-5 text-xs text-muted-foreground">JPG, PNG or GIF — max 2MB.</p>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0 group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={initialImage ?? undefined} alt={name} />
              <AvatarFallback className="bg-linear-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white">
                {name ? getInitials(name) : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Change photo"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
          </div>
          <div>
            <button
              type="button"
              className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-border hover:bg-muted"
            >
              Upload photo
            </button>
            <p className="mt-1.5 text-xs text-muted-foreground/60">
              Photo upload will be available soon.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
        <h2 className="mb-1 text-sm font-semibold text-foreground">General</h2>
        <p className="mb-5 text-xs text-muted-foreground">Update your display name.</p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Display name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSaved(false)
              }}
              placeholder="Your name"
              className="h-10 rounded-xl border-border/60 bg-background text-sm focus-visible:ring-violet-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Email address
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={initialEmail}
                readOnly
                className="h-10 rounded-xl border-border/60 bg-muted/40 pr-32 text-sm text-muted-foreground cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isEmailVerified ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="h-3 w-3" />
                    Not verified
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60">Email cannot be changed here.</p>
          </div>
        </div>

        {!isEmailVerified && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Your email address is not verified. Check your inbox or resend the verification
                email.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 transition-all hover:bg-amber-500/20 dark:text-amber-400"
            >
              Resend
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-5">
          <p className="text-xs text-muted-foreground/60">
            {saved ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Changes saved
              </span>
            ) : isDirty ? (
              'You have unsaved changes.'
            ) : (
              'No changes to save.'
            )}
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              'flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold transition-all duration-200',
              isDirty && !isSaving
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20 hover:bg-violet-500'
                : 'cursor-not-allowed bg-muted text-muted-foreground',
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Danger zone</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Once you delete your account, there is no going back. All your data will be permanently
          removed.
        </p>
        <button
          type="button"
          className="rounded-xl border border-destructive/40 bg-background px-4 py-2 text-xs font-semibold text-destructive transition-all hover:bg-destructive hover:text-white"
        >
          Delete account
        </button>
      </div>
    </div>
  )
}
