'use client'

import { useState } from 'react'
import { api } from '@/api'

export const useUpdateProfile = () => {
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (data: { name?: string; image?: string }) => {
    setIsSaving(true)
    setError(null)
    const result = await api.profile.update(data)
    setIsSaving(false)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    return true
  }

  return {
    save,
    isSaving,
    saved,
    error,
    clearError: () => setError(null),
  }
}
