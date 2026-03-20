import { signIn, signUp } from '@/lib/auth-client'
import { ok, err } from '@/types/result'

export const signInAction = async (email: string, password: string) => {
  const result = await signIn.email({ email, password })

  if (result.error) {
    return err(result.error.message ?? 'Invalid email or password.')
  }

  return ok(result.data)
}

export const signUpAction = async (name: string, email: string, password: string) => {
  const result = await signUp.email({ email, name, password })

  if (result.error) {
    return err(result.error.message ?? 'Something went wrong. Please try again.')
  }

  return ok(result.data)
}
