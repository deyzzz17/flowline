'use client'

import { useSignIn } from '@/hooks/authentification/use-sign-in'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { AlertCircleIcon, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { signInWithGoogle } from '@/lib/auth-client'
import { toast } from 'sonner'

export const SignInForm = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSubmit,
    showPassword,
    setShowPassword,
    fieldErrors,
    setFieldErrors,
  } = useSignIn()

  const validate = () => {
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) errors.email = 'Email is required.'
    if (!password.trim()) errors.password = 'Password is required.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Login failed', {
        description: `Something went wrong while you were logging in. Please check the information you have entered.`,
      })
      return
    }
    await handleSubmit(e)
    toast.info('Login successfull', {
      description: `You have successfully logged in to your account.`,
    })
  }

  return (
    <>
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

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            {fieldErrors.email && (
              <p className="flex items-center gap-1 text-xs font-semibold text-destructive animate-in fade-in slide-in-from-right-1">
                <AlertCircleIcon className="h-3 w-3" />
                {fieldErrors.email}
              </p>
            )}
          </div>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }))
            }}
            autoFocus
            className={cn(
              'h-10 rounded-xl border-border/60 bg-background placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30',
              fieldErrors.email && 'border-destructive/50 focus-visible:ring-destructive/30',
            )}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            {fieldErrors.password ? (
              <p className="flex items-center gap-1 text-xs font-semibold text-destructive animate-in fade-in slide-in-from-right-1">
                <AlertCircleIcon className="h-3 w-3" />
                {fieldErrors.password}
              </p>
            ) : (
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }))
              }}
              className={cn(
                'h-10 rounded-xl border-border/60 bg-background pr-10 placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/30',
                (error || fieldErrors.password) &&
                  'border-destructive/50 focus-visible:ring-destructive/30',
              )}
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

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs text-muted-foreground/60">or</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

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

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/sign-up"
          className="font-semibold text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400"
        >
          Sign up
        </Link>
      </p>
    </>
  )
}
