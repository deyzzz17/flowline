'use client'

import Link from 'next/link'
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FlowlineLogo } from '@/components/header/flowline-logo'
import { useForgotPassword } from '@/hooks/authentification/use-forgot-password'
import { GoogleIcon } from '@/components/icons/google-icon'

export function ForgotPasswordForm() {
  const { email, setEmail, isLoading, state, error, isValidEmail, handleSubmit, reset } =
    useForgotPassword()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <FlowlineLogo />
            <span
              translate="no"
              className="text-[17px] font-bold tracking-tight text-foreground group-hover:text-foreground/80 transition-colors"
            >
              Flowline
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-8 shadow-sm">
          {state === 'sent' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-foreground">Check your inbox</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If an account exists for <strong className="text-foreground">{email}</strong>,
                  we&apos;ve sent a link to reset your password. The link expires in 1 hour.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive the email?{' '}
                <button
                  type="button"
                  onClick={reset}
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Try again
                </button>
              </p>
              <Link href="/sign-in">
                <Button variant="outline" className="w-full mt-2 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          )}

          {state === 'google_account' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
                  <GoogleIcon className="h-7 w-7" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-foreground">Google account</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">{email}</strong> is linked to a Google
                  account. There&apos;s no password to reset, sign in with Google instead.
                </p>
              </div>
              <Link href="/sign-in">
                <Button className="w-full gap-2 mt-2">
                  <GoogleIcon className="h-4 w-4" />
                  Sign in with Google
                </Button>
              </Link>
              <button
                type="button"
                onClick={reset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}

          {state === 'idle' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold text-foreground">Forgot your password?</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9 h-10"
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!isValidEmail || isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking…
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
