'use client'

import { useState } from 'react'
import { api } from '@/api'

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

export const useUploadAvatar = (onSuccess: (url: string) => void) => {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File) => {
    setError(null)

    if (!VALID_TYPES.includes(file.type)) {
      setError('Invalid file type. Please use JPG, PNG, GIF or WebP.')
      return false
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum size is 2MB.')
      return false
    }

    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const uploadResult = await api.profile.uploadAvatar(formData)
    if (!uploadResult.ok) {
      setError(uploadResult.error)
      setIsUploading(false)
      return false
    }

    const updateResult = await api.profile.update({ image: uploadResult.value })
    setIsUploading(false)

    if (!updateResult.ok) {
      setError('Image uploaded but profile update failed.')
      return false
    }

    onSuccess(uploadResult.value)
    return true
  }

  return {
    upload,
    isUploading,
    error,
    clearError: () => setError(null),
  }
}
