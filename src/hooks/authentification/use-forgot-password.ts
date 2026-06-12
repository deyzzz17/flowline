'use client'

import { useState } from 'react'
import { forgetPassword } from '@/lib/auth-client'

export type ForgotPasswordState = 'idle' | 'sent' | 'google_account'

export function useForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [state, setState] = useState<ForgotPasswordState>('idle')
  const [error, setError] = useState<string | null>(null)

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/check-account-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      console.log('[check-account-type]', res.status, await res.clone().text())

      if (res.status === 429) {
        setError('Too many attempts. Please wait a moment and try again.')
        return
      }

      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        return
      }

      const { type } = await res.json()

      if (type === 'google') {
        setState('google_account')
        return
      }

      await forgetPassword(email, `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/reset-password`)
      setState('sent')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setState('idle')
    setError(null)
  }

  return {
    email,
    setEmail,
    isLoading,
    state,
    error,
    isValidEmail,
    handleSubmit,
    reset,
  }
}
