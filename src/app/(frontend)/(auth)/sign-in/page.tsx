import Image from 'next/image'
import { Orb } from '@/components/home/orb'
import { SignInForm } from '@/components/authentification/sign-in-form'
import { requireGuest } from '@/lib/require-auth'

export default async function SignInPage() {
  await requireGuest()

  return (
    <div className="relative grid h-full lg:grid-cols-2">
      <Orb className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500 opacity-5 dark:opacity-10 blur-3xl animate-pulse" />
      <Orb className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-indigo-500 opacity-5 dark:opacity-10 blur-3xl animate-pulse" />

      <div className="relative z-10 flex flex-col p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-8">
            <SignInForm />
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 z-10 bg-linear-to-br from-violet-600/20 via-transparent to-indigo-600/20" />
        <Image src="/auth-cover.jpg" alt="" fill priority sizes="50vw" className="object-cover" />
      </div>
    </div>
  )
}
