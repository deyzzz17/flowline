'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/api'

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

export const useSignUp = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirectTo')
  const redirectTo =
    redirectParam?.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : null
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirm?: string
  }>({})

  const allRulesPassed = passwordRules.every((r) => r.test(password))
  const passwordsMatch = password === confirm
  const confirmTouched = confirm.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const result = await api.authentifications.signUp(name, email, password)
    if (!result.ok) {
      setError(result.error)
      setIsLoading(false)
      return
    }
    router.push(redirectTo ?? '/dashboard')
  }

  return {
    redirectTo,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSubmit,
    confirm,
    setConfirm,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    passwordFocused,
    setPasswordFocused,
    formError,
    setFormError,
    allRulesPassed,
    passwordsMatch,
    confirmTouched,
    fieldErrors,
    setFieldErrors,
  }
}
