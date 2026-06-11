'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

export function useVerifyEmail() {
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const sendVerification = async (email: string) => {
    if (isSending || sent) return
    setIsSending(true)

    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: '/dashboard',
      })

      if (result.error) {
        toast.error('Failed to send verification email. Please try again.')
        return
      }

      setSent(true)
      toast.success('Verification email sent, check your inbox.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return { sendVerification, isSending, sent }
}
