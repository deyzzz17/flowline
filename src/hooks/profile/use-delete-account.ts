'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/api'
import { authClient } from '@/lib/auth-client'

export const useDeleteAccount = () => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const remove = async () => {
    setIsDeleting(true)
    setError(null)

    const result = await api.profile.delete()

    if (!result.ok) {
      setError(result.error)
      setIsDeleting(false)
      return false
    }

    await authClient.signOut()
    router.push('/')
    setIsDeleting(false)
    return true
  }

  return { remove, isDeleting, error, clearError: () => setError(null) }
}
