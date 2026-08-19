'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/api'

export const useSignIn = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirectTo')
  const redirectTo =
    redirectParam?.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const result = await api.authentifications.signIn(email, password)
    if (!result.ok) {
      setError(result.error)
      setIsLoading(false)
      return
    }
    router.push(redirectTo ?? '/dashboard')
  }

  return {
    redirectTo,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSubmit,
    showPassword,
    setShowPassword,
    fieldErrors,
    setFieldErrors,
  }
}
