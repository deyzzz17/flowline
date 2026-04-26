'use client'

import { useState } from 'react'

const SESSION_KEY = 'newsletter_dismissed'

export const useNewsletter = () => {
  const [sessionDismissed, setSessionDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  })

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, 'true')
    }
    setSessionDismissed(true)
  }

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail) return

    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (typeof window !== 'undefined') {
        localStorage.setItem('newsletter_subscribed', 'true')
      }
      setSubscribed(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Ne pas afficher si déjà inscrit (localStorage) ou dismissé cette session
  const isPermanentlyHidden = () => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('newsletter_subscribed') === 'true'
  }

  const isVisible = !sessionDismissed && !subscribed && !isPermanentlyHidden()

  return {
    email,
    setEmail,
    isLoading,
    error,
    isValidEmail,
    isVisible,
    subscribed,
    dismiss,
    subscribe,
  }
}
