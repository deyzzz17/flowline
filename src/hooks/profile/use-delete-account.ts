'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/api'

export const useDeleteAccount = () => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const remove = async () => {
    setIsDeleting(true)
    setError(null)
    const result = await api.profile.delete()
    setIsDeleting(false)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    router.push('/sign-up')
    return true
  }

  return { remove, isDeleting, error, clearError: () => setError(null) }
}
