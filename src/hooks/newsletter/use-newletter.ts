'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { subscribeToNewsletter } from '@/api/newsletter/actions'
import { checkNewsletterStatus } from '@/api/newsletter/actions'

const SESSION_DISMISSED_KEY = 'newsletter_dismissed'

export const useNewsletter = () => {
  const { data: session } = useSession()
  const isEmailVerified = session?.user?.emailVerified ?? false
  const accountEmail = session?.user?.email ?? ''
  const userId = session?.user?.id ?? ''

  const [sessionDismissed, setSessionDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true'
  })

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [serverSubscribed, setServerSubscribed] = useState<boolean | null>(null)

  useEffect(() => {
    if (accountEmail && !email) {
      setEmail(accountEmail)
    }
  }, [accountEmail])

  useEffect(() => {
    if (!userId || !isEmailVerified) return
    checkNewsletterStatus().then((status) => {
      setServerSubscribed(status)
    })
  }, [userId, isEmailVerified])

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isAccountEmail = email.toLowerCase() === accountEmail.toLowerCase()

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true')
    }
    setSessionDismissed(true)
  }

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail || !isEmailVerified) return
    if (!isAccountEmail) {
      setError('You must use your account email address to subscribe.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await subscribeToNewsletter(email)
      if ('error' in result) {
        setError(result.error ?? 'Something went wrong. Please try again.')
        return
      }
      setSubscribed(true)
      setServerSubscribed(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isSubscribed = subscribed || serverSubscribed === true

  const isVisible = isSubscribed || (!sessionDismissed && serverSubscribed === false)

  return {
    email,
    setEmail,
    isLoading,
    error,
    isValidEmail,
    isAccountEmail,
    isVisible,
    subscribed: isSubscribed,
    isEmailVerified,
    accountEmail,
    dismiss,
    subscribe,
  }
}
