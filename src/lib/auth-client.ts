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
