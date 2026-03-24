'use server'

import { cloudinary } from '@/lib/cloudinary'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ok, err } from '@/types/result'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'

export const getCloudinarySignature = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user?.id
    if (!userId) return err('Not authenticated')

    const timestamp = Math.round(new Date().getTime() / 1000)
    const publicId = `flowline/avatars/user_${userId}`

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        public_id: publicId,
        overwrite: true,
        transformation: 'c_fill,g_face,h_200,w_200/f_webp,q_auto',
      },
      process.env.CLOUDINARY_API_SECRET!,
    )

    return ok({
      timestamp,
      signature,
      publicId,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    })
  } catch {
    return err('Error generating signature')
  }
}

export const updateProfile = async (data: { name?: string; image?: string }) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return err('Not authenticated')

    await auth.api.updateUser({
      headers: await headers(),
      body: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.image !== undefined && { image: data.image }),
      },
    })

    revalidatePath('/', 'layout')

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

    return ok(true)
  } catch {
    return err('Error while deleting account')
  }
}
