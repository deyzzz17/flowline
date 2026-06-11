'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, X, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { useVerifyEmail } from '@/hooks/profile/use-verify-email'
import { cn } from '@/lib/utils'

const DISMISSED_KEY = 'flowline_verify_email_dismissed'

interface EmailVerificationBannerProps {
  email: string
  isEmailVerified: boolean
}

export function EmailVerificationBanner({ email, isEmailVerified }: EmailVerificationBannerProps) {
  const [visible, setVisible] = useState(false)
  const { sendVerification, isSending, sent } = useVerifyEmail()

  useEffect(() => {
    if (isEmailVerified) return
    const dismissed = sessionStorage.getItem(DISMISSED_KEY)
    if (!dismissed) setVisible(true)
  }, [isEmailVerified])

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (isEmailVerified || !visible) return null

  return (
    <div className={cn(
      'mb-5 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-3',
      'animate-in fade-in slide-in-from-top-2 duration-300',
    )}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          Verify your email address
        </p>
        <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
          Verify your email to unlock all features and subscribe to the Flowline newsletter.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => sendVerification(email)}
          disabled={isSending || sent}
          className={cn(
            'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
            sent
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-60',
          )}
        >
          {isSending ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Sending...
            </>
          ) : sent ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Email sent
            </>
          ) : (
            <>
              <Mail className="h-3 w-3" />
              Verify now
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-500/60 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}