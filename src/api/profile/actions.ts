'use server'

import { cloudinary } from '@/lib/cloudinary'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ok, err } from '@/types/result'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'

export const uploadAvatar = async (formData: FormData) => {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) return err('Not authenticated')

  const file = formData.get('file') as File
  if (!file) return err('No file provided')

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) return err('Invalid file type')
  if (file.size > 2 * 1024 * 1024) return err('File too large')

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const dataUri = `data:${file.type};base64,${base64}`

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'flowline/avatars',
    public_id: `user_${userId}`,
    overwrite: true,
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { format: 'webp', quality: 'auto' },
    ],
  })

  revalidatePath('/dashboard')
  revalidatePath('/profile')

  return ok(result.secure_url)
}

export const updateProfile = async (data: { name?: string; image?: string }) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return err('Not authenticated')

    await auth.api.updateUser({
      headers: await headers(),
      body: {
        ...(data.name && { name: data.name }),
        ...(data.image && { image: data.image }),
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/profile')

    return ok(true)
  } catch {
    return err('Error while updating profile')
  }
}

export const deleteAccount = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user?.id
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    await payload.delete({
      collection: 'tasks',
      where: { userId: { equals: userId } },
    })

    await cloudinary.uploader.destroy(`flowline/avatars/user_${userId}`)

    await auth.api.deleteUser({
      headers: await headers(),
      body: {
        callbackURL: `${process.env.BETTER_AUTH_URL}/sign-up`,
      },
    })

    return ok(true)
  } catch {
    return err('Error while deleting account')
  }
}
