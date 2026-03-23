import { createAuthClient } from 'better-auth/react'
export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL!,
})

export const signInWithGoogle = () => signIn.social({ provider: 'google' })

export const { signIn, signUp, signOut, useSession } = authClient
