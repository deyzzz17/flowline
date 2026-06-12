'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { auth } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import { Pool } from 'pg'
import { ok, err } from '@/types/result'
import { revalidatePath } from 'next/cache'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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
    const userEmail = session?.user?.email
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    await payload.delete({ collection: 'tasks', where: { userId: { equals: userId } } })
    await payload.delete({ collection: 'task-completions', where: { userId: { equals: userId } } })

    await payload.delete({ collection: 'lists', where: { userId: { equals: userId } } })
    await payload.delete({ collection: 'user-tags', where: { userId: { equals: userId } } })

    await payload.delete({ collection: 'timer-sessions', where: { userId: { equals: userId } } })
    await payload.delete({ collection: 'timer-categories', where: { userId: { equals: userId } } })
    await payload.delete({ collection: 'timer-configs', where: { userId: { equals: userId } } })

    await payload.delete({ collection: 'calendar-events', where: { userId: { equals: userId } } })
    await payload.delete({
      collection: 'calendar-categories',
      where: { userId: { equals: userId } },
    })
    await payload.delete({
      collection: 'google-calendar-syncs',
      where: { userId: { equals: userId } },
    })

    await payload.delete({ collection: 'habits', where: { userId: { equals: userId } } })
    await payload.delete({ collection: 'habit-completions', where: { userId: { equals: userId } } })

    try {
      await cloudinary.uploader.destroy(`flowline/avatars/user_${userId}`)
    } catch {}

    if (userEmail) {
      try {
        const audienceId = process.env.RESEND_AUDIENCE_ID
        if (audienceId) {
          await fetch(
            `https://api.resend.com/audiences/${audienceId}/contacts/email:${encodeURIComponent(userEmail)}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${process.env.RESEND_FULL_ACCESS_KEY}` },
            },
          )
        }
      } catch {}
    }

    if (userEmail) {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL })
      try {
        await pool.query(`DELETE FROM verification WHERE identifier = $1`, [
          `reset-password:${userEmail}`,
        ])
      } finally {
        await pool.end()
      }
    }

    await auth.api.deleteUser({
      headers: await headers(),
      body: {},
    })

    return ok(true)
  } catch (e) {
    console.error('deleteAccount error:', e)
    return err('Error while deleting account')
  }
}
