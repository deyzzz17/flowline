'use server'

export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/forget-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      }),
    })
    console.log('[requestPasswordReset] status:', res.status)
    return { ok: true }
  } catch (e) {
    console.error('[requestPasswordReset] error:', e)
    return { ok: true }
  }
}
