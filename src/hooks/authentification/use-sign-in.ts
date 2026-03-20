'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/api'

export function useSignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

    router.push('/dashboard')
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSubmit,
  }
}
