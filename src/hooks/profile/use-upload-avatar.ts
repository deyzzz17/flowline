'use client'

import { useState } from 'react'

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

export const useUploadAvatar = (onPreview: (previewUrl: string, file: File) => void) => {
  const [error, setError] = useState<string | null>(null)

  const selectFile = (file: File) => {
    setError(null)

    if (!VALID_TYPES.includes(file.type)) {
      setError('Invalid file type. Please use JPG, PNG, GIF or WebP.')
      return false
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum size is 2MB.')
      return false
    }

    const previewUrl = URL.createObjectURL(file)
    onPreview(previewUrl, file)
    return true
  }

  return {
    selectFile,
    error,
    clearError: () => setError(null),
  }
}
