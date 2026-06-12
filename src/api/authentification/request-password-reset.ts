'use server'

import { auth } from '@/lib/auth'

export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      },
    })
    return { ok: true }
  } catch (e) {
    console.error('[requestPasswordReset] error:', e)
    return { ok: true }
  }
}
