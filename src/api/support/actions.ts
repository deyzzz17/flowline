'use server'

import 'server-only'
import { Resend } from 'resend'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const feedbackSchema = z.object({
  subject: z.string().min(1).max(200).trim(),
  message: z.string().min(1).max(5000).trim(),
})

export async function sendFeedbackEmail(input: { subject: string; message: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { error: 'Not authenticated' }
  }

  const parsed = feedbackSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input' }
  }

  const { subject, message } = parsed.data
  const userEmail = session.user.email ?? 'Unknown'
  const userName = session.user.name ?? 'Unknown'

  try {
    await resend.emails.send({
      from: 'Flowline Feedback <noreply@flowlineworkspace.com>',
      to: 'support@flowlineworkspace.com',
      replyTo: userEmail,
      subject: `[Feedback] ${subject}`,
      text: [
        `From: ${userName} <${userEmail}>`,
        `Subject: ${subject}`,
        '',
        message,
      ].join('\n'),
    })

    return { success: true }
  } catch (e) {
    console.error('Failed to send feedback email:', e)
    return { error: 'Failed to send email. Please try again.' }
  }
}