'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircleIcon } from 'lucide-react'
import Image from 'next/image'
import { Orb } from '@/components/dashboard/orb'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await signIn.email({ email, password })

    if (result.error) {
      setError('Invalid email or password. Please try again.')
      setIsLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div className="relative grid h-full lg:grid-cols-2">
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 dark:hidden"
        style={{
          backgroundImage: `linear-gradient(to right,rgba(109,40,217,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(109,40,217,0.04) 1px,transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />

      <Orb className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500 opacity-5 dark:opacity-10 blur-3xl animate-pulse" />
      <Orb className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-indigo-500 opacity-5 dark:opacity-10 blur-3xl animate-pulse" />

      <div className="relative z-10 flex flex-col p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-1.5 text-center md:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your account to continue.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
                <AlertCircleIcon className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-10 rounded-xl border-border/60 bg-background placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={cn(
                    'h-10 rounded-xl border-border/60 bg-background placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30',
                    error && 'border-destructive/50 focus-visible:ring-destructive/30',
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="group relative h-10 w-full overflow-hidden rounded-xl bg-violet-600 font-semibold text-white shadow-sm shadow-violet-500/20 transition-all hover:bg-violet-500 hover:shadow-violet-500/30 disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
                <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a
                href="/sign-up"
                className="font-semibold text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400"
              >
                Sign up
              </a>
            </p>
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
