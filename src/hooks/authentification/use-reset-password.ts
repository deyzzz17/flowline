'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { doResetPassword } from '@/api/authentification/do-reset-password'

export const passwordRules = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number (0-9)', test: (p: string) => /[0-9]/.test(p) },
  {
    id: 'special',
    label: 'One special character (!@#…)',
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
]

export function useResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const allRulesPassed = passwordRules.every((r) => r.test(password))
  const passwordsMatch = password === confirm && confirm.length > 0
  const confirmTouched = confirm.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allRulesPassed || !passwordsMatch || !token || !email) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await doResetPassword(email, token, password)

      if (!result.ok) {
        if (result.error === 'expired') {
          setError('This reset link has expired. Please request a new one.')
        } else if (result.error === 'invalid') {
          setError('This reset link is invalid. Please request a new one.')
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/sign-in'), 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    token,
    email,
    password,
    setPassword,
    confirm,
    setConfirm,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    isLoading,
    error,
    success,
    allRulesPassed,
    passwordsMatch,
    confirmTouched,
    handleSubmit,
  }
}
