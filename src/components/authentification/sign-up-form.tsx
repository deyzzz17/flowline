'use client'

import { passwordRules, useSignUp } from '@/hooks/authentification/use-sign-up'
import { signInWithGoogle } from '@/lib/auth-client'
import { AlertCircleIcon, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import Link from 'next/link'

export const SignUpForm = () => {
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSubmit,
    confirm,
    setConfirm,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    passwordFocused,
    setPasswordFocused,
    formError,
    setFormError,
    allRulesPassed,
    passwordsMatch,
    confirmTouched,
  } = useSignUp()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!allRulesPassed) {
      setFormError('Password does not meet all requirements.')
      return
    }
    if (!passwordsMatch) {
      setFormError('Passwords do not match.')
      return
    }

    await handleSubmit(e)
  }

  const displayError = formError ?? error

  return (
    <>
      <div className="space-y-1.5 text-center md:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">Start your journey with Flowline today.</p>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          {displayError}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs text-muted-foreground/60">or</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="h-10 rounded-xl border-border/60 bg-background placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30"
          />
        </div>

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
            className="h-10 rounded-xl border-border/60 bg-background placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              required
              className="h-10 rounded-xl border-border/60 bg-background pr-10 placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {(passwordFocused || password.length > 0) && (
            <div className="space-y-1.5 rounded-xl border border-border/50 bg-muted/30 p-3 animate-in fade-in slide-in-from-top-1">
              {passwordRules.map((rule) => {
                const passed = rule.test(password)
                return (
                  <div key={rule.id} className="flex items-center gap-2">
                    {passed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                    )}
                    <span
                      className={cn(
                        'text-xs transition-colors',
                        passed
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-muted-foreground/60',
                      )}
                    >
                      {rule.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-sm font-medium">
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className={cn(
                'h-10 rounded-xl border-border/60 bg-background pr-10 placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30',
                confirmTouched &&
                  !passwordsMatch &&
                  'border-destructive/50 focus-visible:ring-destructive/30',
                confirmTouched &&
                  passwordsMatch &&
                  'border-emerald-500/50 focus-visible:ring-emerald-500/30',
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {confirmTouched && (
            <p
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors animate-in fade-in',
                passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
              )}
            >
              {passwordsMatch ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                </>
              ) : (
                <>
                  <AlertCircleIcon className="h-3.5 w-3.5" /> Passwords do not match
                </>
              )}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || !allRulesPassed || (confirmTouched && !passwordsMatch)}
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
              Creating account...
            </span>
          ) : (
            'Create account'
          )}
          <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        </Button>
      </form>

      <button
        type="button"
        onClick={() => signInWithGoogle()}
        className="flex h-10 w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-background text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-border"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-xs text-muted-foreground/60">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="font-semibold text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
