'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Camera, CheckCircle2, Loader2, ShieldAlert, User, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [imageError, setImageError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isDirty = name !== initialName

  const handleSave = async () => {
    if (!isDirty) return
    setIsSaving(true)
    // TODO: authClient.updateUser({ name })
    await new Promise((r) => setTimeout(r, 800))
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const showFallback = !initialImage || imageError

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="sticky top-0 z-10 flex h-12 items-center border-b border-white/5 bg-[#2b2d31] px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-medium text-[#b5bac1] transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">My Account</h1>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/5 bg-[#232428]">
          <div className="relative h-24 bg-linear-to-r from-violet-600 to-purple-700">
            <div className="absolute -bottom-10 left-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex h-20 w-20 items-center justify-center"
                  aria-label="Change avatar"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-full border-[5px] border-[#232428] bg-[#313338]">
                    {!showFallback ? (
                      <Image
                        src={initialImage!}
                        alt={name}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-xl font-bold text-white">
                        {name ? getInitials(name) : <User className="h-8 w-8" />}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                    <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Change
                    </span>
                  </div>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" />
              </div>
            </div>
          </div>

          <div className="mt-12 px-4 pb-4 pt-2">
            <p className="text-xl font-bold text-white">{name || 'Unknown'}</p>
            <p className="text-sm text-[#b5bac1]">{initialEmail}</p>
          </div>

          <div className="mx-4 border-t border-white/5" />

          <div className="space-y-0 p-4">
            <div className="rounded-lg bg-[#2b2d31] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#b5bac1]">
                    Display name
                  </p>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setSaved(false)
                    }}
                    placeholder="Your display name"
                    className="h-9 rounded-md border-0 bg-[#1e1f22] text-sm text-white placeholder:text-[#4e5058] focus-visible:ring-1 focus-visible:ring-violet-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="my-2" />

            <div className="rounded-lg bg-[#2b2d31] p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#b5bac1]">
                Email address
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="truncate text-sm text-white">{initialEmail}</p>
                  {isEmailVerified ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      <ShieldAlert className="h-2.5 w-2.5" />
                      Unverified
                    </span>
                  )}
                </div>
                {!isEmailVerified && (
                  <button
                    type="button"
                    className="shrink-0 rounded-md bg-[#4e5058]/40 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4e5058]/60"
                  >
                    Verify
                  </button>
                )}
              </div>
              {!isEmailVerified && (
                <p className="mt-2 text-xs text-amber-400/70">
                  You must verify your email address to access all features.
                </p>
              )}
            </div>
          </div>

          {isDirty && (
            <div className="mx-4 mb-4 flex items-center justify-between gap-4 rounded-lg bg-[#111214] px-4 py-3 animate-in slide-in-from-bottom-2">
              <p className="text-xs text-[#b5bac1]">Careful — you have unsaved changes!</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setName(initialName)
                    setSaved(false)
                  }}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-[#b5bac1] transition-colors hover:text-white"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-md bg-[#248046] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1a6b38] disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Saved!
                    </>
                  ) : (
                    'Save changes'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-red-500/20 bg-[#232428]">
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-semibold text-white">Delete Account</p>
              <p className="mt-0.5 text-xs text-[#b5bac1]">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500 hover:text-white hover:border-transparent"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
