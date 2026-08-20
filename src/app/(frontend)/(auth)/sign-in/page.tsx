import { Suspense } from 'react'
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
            <Suspense>
              <SignInForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-linear-to-br from-violet-600/10 via-background to-indigo-600/10 lg:flex">
        <Orb className="absolute top-10 right-10 h-72 w-72 rounded-full bg-violet-500 opacity-10 dark:opacity-20 blur-3xl" />
        <Orb className="absolute bottom-10 left-10 h-56 w-56 rounded-full bg-indigo-500 opacity-10 dark:opacity-20 blur-3xl" />
        <Image
          src="/auth-cover.png"
          alt=""
          width={1717}
          height={916}
          priority
          quality={90}
          className="relative z-10 h-auto max-h-[80vh] w-auto max-w-[860px] rounded-2xl object-contain shadow-2xl shadow-violet-950/30"
        />
      </div>
    </div>
  )
}
