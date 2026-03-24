'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getCloudinarySignature } from '@/api/profile/actions'
import { api } from '@/api'

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

export const useUploadAvatar = (onSuccess: (url: string) => void) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (!VALID_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Please use JPG, PNG, GIF or WebP.')
      }
      if (file.size > MAX_SIZE) {
        throw new Error('File is too large. Maximum size is 2MB.')
      }

      const sigResult = await getCloudinarySignature()
      if (!sigResult.ok) throw new Error(sigResult.error)

      const { timestamp, signature, publicId, apiKey, cloudName } = sigResult.value

      const formData = new FormData()
      formData.append('file', file)
      formData.append('timestamp', String(timestamp))
      formData.append('signature', signature)
      formData.append('api_key', apiKey)
      formData.append('public_id', publicId)
      formData.append('overwrite', 'true')
      formData.append('transformation', 'c_fill,g_face,h_200,w_200/f_webp,q_auto')

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload to Cloudinary failed')

      const data = await res.json()
      const imageUrl = data.secure_url as string

      const updateResult = await api.profile.update({ image: imageUrl })
      if (!updateResult.ok) throw new Error('Profile update failed')

      return imageUrl
    },

    onSuccess: (url) => {
      onSuccess(url)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return {
    upload: (file: File) => mutation.mutateAsync(file),
    isUploading: mutation.isPending,
    error: mutation.error?.message ?? null,
    clearError: () => mutation.reset(),
  }
}
