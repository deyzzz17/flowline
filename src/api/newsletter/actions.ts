'use server'

import 'server-only'
import { Resend } from 'resend'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

const resend = new Resend(process.env.RESEND_API_KEY)
const AUDIENCE_ID = '575501fb-7e5d-4b50-b582-fde770ca8a20'

export async function subscribeToNewsletter(email: string) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return { error: 'Not authenticated' }
  }

  if (!session.user.emailVerified) {
    return { error: 'You must verify your email before subscribing.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email address.' }
  }

  try {
    await resend.contacts.create({
      audienceId: AUDIENCE_ID,
      email,
      firstName: session.user.name?.split(' ')[0] ?? '',
      lastName: session.user.name?.split(' ').slice(1).join(' ') ?? '',
      unsubscribed: false,
    })

    return { success: true }
  } catch (e) {
    console.error('Failed to subscribe to newsletter:', e)
    return { error: 'Failed to subscribe. Please try again.' }
  }
}