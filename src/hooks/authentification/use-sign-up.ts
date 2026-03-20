'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/api'

export function useSignUp() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

    router.push('/')
  }

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSubmit,
  }
}
