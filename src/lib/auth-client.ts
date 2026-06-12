import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { auth } from './auth'

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL!,
  plugins: [inferAdditionalFields<typeof auth>()],
})

export const signInWithGoogle = async () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  localStorage.setItem('pending_timezone', timezone)
  await signIn.social({ provider: 'google' })
}

export const { signIn, signUp, signOut, useSession, updateUser, deleteUser } = authClient

export const forgetPassword = (email: string, redirectTo: string) =>
  fetch('/api/auth/request-password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirectTo }),
  }).then((r) => r.json())

export const resetPassword = (newPassword: string, token: string) =>
  authClient.resetPassword({ newPassword, token })
