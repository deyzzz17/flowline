import { Suspense } from 'react'
import { ForgotPasswordForm } from '@/components/authentification/forgot-password-form'

export const metadata = {
  title: 'Forgot Password — Flowline',
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
