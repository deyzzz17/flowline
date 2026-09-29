import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields, organizationClient } from 'better-auth/client/plugins'
import { auth } from './auth'

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL!,
  plugins: [inferAdditionalFields<typeof auth>(), organizationClient()],
  // Better Auth refetches /api/auth/get-session on every tab focus by default
  // — a Vercel function call each time, for data that changes only on
  // sign-in/out (and the app layout already provides the user).
  sessionOptions: { refetchOnWindowFocus: false },
})

export const signInWithGoogle = async (callbackURL?: string) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  localStorage.setItem('pending_timezone', timezone)
  await signIn.social({ provider: 'google', callbackURL })
}

export const { signIn, signUp, signOut, useSession, updateUser, deleteUser } = authClient

export const resetPassword = (newPassword: string, token: string) =>
  authClient.resetPassword({ newPassword, token })
