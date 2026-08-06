'use server'

import 'server-only'
import { Resend } from 'resend'
import { z } from 'zod'
import { getSession } from '@/lib/get-session'
import { getUserPlanLimits } from '@/lib/get-user-plan'
import { SAFETY_CAP_ERRORS, type SafetyCapError } from '@/lib/plan-limits'

const resend = new Resend(process.env.RESEND_API_KEY)

const feedbackSchema = z.object({
  subject: z.string().min(1).max(200).trim(),
  message: z.string().min(1).max(5000).trim(),
})

export async function sendFeedbackEmail(input: { subject: string; message: string }) {
  const session = await getSession()
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
      text: [`From: ${userName} <${userEmail}>`, `Subject: ${subject}`, '', message].join('\n'),
    })
    return { success: true }
  } catch (e) {
    console.error('Failed to send feedback email:', e)
    return { error: 'Failed to send email. Please try again.' }
  }
}

const capErrorValues = Object.values(SAFETY_CAP_ERRORS) as [SafetyCapError, ...SafetyCapError[]]

const limitIncreaseSchema = z.object({
  capError: z.enum(capErrorValues),
})

export async function requestLimitIncrease(input: { capError: SafetyCapError }) {
  const session = await getSession()
  if (!session?.user) {
    return { error: 'Not authenticated' }
  }

  const parsed = limitIncreaseSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input' }
  }

  const { capError } = parsed.data
  const { plan } = await getUserPlanLimits()
  const userEmail = session.user.email ?? 'Unknown'
  const userName = session.user.name ?? 'Unknown'

  try {
    await resend.emails.send({
      from: 'Flowline Alerts <noreply@flowlineworkspace.com>',
      to: 'support@flowlineworkspace.com',
      replyTo: userEmail,
      subject: `[Limit increase request] ${capError}`,
      text: [
        `User: ${userName} <${userEmail}>`,
        `Plan: ${plan}`,
        `Hit absolute safety cap: ${capError}`,
        '',
        'This user is on a paid plan and reached the technical safety cap ' +
          '(not the product limit — the plan itself is unlimited for this field). ' +
          'Consider raising the cap in plan-limits.ts if this is a legitimate use case.',
      ].join('\n'),
    })
    return { success: true }
  } catch (e) {
    console.error('Failed to send limit increase request email:', e)
    return { error: 'Failed to send email. Please try again.' }
  }
}
