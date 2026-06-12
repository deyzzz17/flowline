import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/authentification/reset-password-form'

export const metadata = {
  title: 'Reset Password — Flowline',
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
