'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getCloudinarySignature, updateProfile } from '@/api/profile/actions'

const uploadToCloudinary = async (
  file: File,
  signature: {
    timestamp: number
    signature: string
    publicId: string
    apiKey: string
    cloudName: string
  },
) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('timestamp', String(signature.timestamp))
  formData.append('signature', signature.signature)
  formData.append('api_key', signature.apiKey)
  formData.append('public_id', signature.publicId)
  formData.append('overwrite', 'true')
  formData.append('transformation', 'c_fill,g_face,h_200,w_200/f_webp,q_auto')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error('Upload to Cloudinary failed')
  const data = await res.json()
  return data.secure_url as string
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: async ({ name, pendingFile }: { name: string; pendingFile: File | null }) => {
      let imageUrl: string | undefined

      if (pendingFile) {
        const sigResult = await getCloudinarySignature()
        if (!sigResult.ok) throw new Error(sigResult.error)
        imageUrl = await uploadToCloudinary(pendingFile, sigResult.value)
      }

      const result = await updateProfile({
        name,
        ...(imageUrl && { image: imageUrl }),
      })

      if (!result.ok) throw new Error(result.error)
      return imageUrl
    },

    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return {
    save: (name: string, pendingFile: File | null) => mutation.mutateAsync({ name, pendingFile }),
    isSaving: mutation.isPending,
    saved,
    error: mutation.error?.message ?? null,
    clearError: () => mutation.reset(),
  }
}
