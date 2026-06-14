'use server'

import 'server-only'
import { Resend } from 'resend'
import { getSession } from '@/lib/get-session'

const resend = new Resend(process.env.RESEND_FULL_ACCESS_KEY)
const AUDIENCE_ID = '575501fb-7e5d-4b50-b582-fde770ca8a20'

export async function subscribeToNewsletter(email: string) {
  const session = await getSession()

  if (!session?.user) {
    return { error: 'Not authenticated' }
  }

  if (!session.user.emailVerified) {
    return { error: 'You must verify your email before subscribing.' }
  }

  if (email.toLowerCase() !== session.user.email.toLowerCase()) {
    return { error: 'You must use your account email address to subscribe.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email address.' }
  }

  try {
    const result = await resend.contacts.create({
      audienceId: AUDIENCE_ID,
      email,
      firstName: session.user.name?.split(' ')[0] ?? '',
      lastName: session.user.name?.split(' ').slice(1).join(' ') ?? '',
      unsubscribed: false,
    })

    if (result.error) {
      console.error('Resend error:', result.error)
      return { error: 'Failed to subscribe. Please try again.' }
    }

    return { success: true }
  } catch (e) {
    console.error('Failed to subscribe to newsletter:', e)
    return { error: 'Failed to subscribe. Please try again.' }
  }
}

export async function checkNewsletterStatus(): Promise<boolean> {
  try {
    const session = await getSession()
    if (!session?.user?.email) return false

    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (!audienceId) return false

    const res = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts/email:${encodeURIComponent(session.user.email)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${process.env.RESEND_FULL_ACCESS_KEY}` },
      },
    )

    if (!res.ok) return false

    const data = await res.json()
    return data?.unsubscribed === false
  } catch {
    return false
  }
}
