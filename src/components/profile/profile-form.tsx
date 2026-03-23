'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Camera,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  User,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUpdateProfile } from '@/hooks/profile/use-update-profile'
import { useUploadAvatar } from '@/hooks/profile/use-upload-avatar'
import { useDeleteAccount } from '@/hooks/profile/use-delete-account'

function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
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
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [currentImage, setCurrentImage] = useState(initialImage)
  const fileRef = useRef<HTMLInputElement>(null)

  const { save, isSaving, saved, error: saveError, clearError: clearSaveError } = useUpdateProfile()

  const {
    upload,
    isUploading,
    error: uploadError,
    clearError: clearUploadError,
  } = useUploadAvatar((url) => setCurrentImage(url))

  const {
    remove,
    isDeleting,
    error: deleteError,
    clearError: clearDeleteError,
  } = useDeleteAccount()

  const isDirty = name !== initialName
  const displayError = uploadError ?? saveError ?? deleteError

  const clearAllErrors = () => {
    clearUploadError()
    clearSaveError()
    clearDeleteError()
  }

  const handleSave = async () => {
    const success = await save({ name })
    if (success) router.refresh()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const success = await upload(file)
    if (success) router.refresh()
    e.target.value = ''
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
      <section className="mt-10 mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Account
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </section>

      {displayError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {displayError}
          </div>
          <button
            type="button"
            onClick={clearAllErrors}
            className="text-destructive/60 transition-colors hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
          <h2 className="mb-5 text-sm font-semibold text-foreground">General</h2>

          <div className="flex items-start gap-6">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              className="group relative shrink-0"
              aria-label="Change avatar"
            >
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentImage ?? undefined} alt={name} />
                <AvatarFallback className="bg-linear-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white">
                  {name ? getInitials(name) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-white" />
                    <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Change
                    </span>
                  </>
                )}
              </div>
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex-1 min-w-0 space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  className="h-10 rounded-xl border-border/60 bg-background text-sm focus-visible:ring-violet-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Email address
                </Label>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="truncate text-sm text-muted-foreground">{initialEmail}</span>
                    {isEmailVerified ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="h-2.5 w-2.5" />
                        Unverified
                      </span>
                    )}
                  </div>
                  {!isEmailVerified && (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 transition-all hover:bg-amber-500/20 dark:text-amber-400"
                    >
                      Verify
                    </button>
                  )}
                </div>
                {!isEmailVerified && (
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                    Verify your email to access all features.
                  </p>
                )}
              </div>
            </div>
          </div>

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
          <h2 className="mb-1 text-sm font-semibold text-foreground">Delete zone</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Once you delete your account, there is no going back. All your data will be permanently
            removed.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-background px-4 py-2 text-xs font-semibold text-destructive transition-all hover:bg-destructive hover:text-white hover:border-transparent"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Your account and all associated data — including
                  your tasks — will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={remove}
                  disabled={isDeleting}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete permanently'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
