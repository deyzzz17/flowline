'use client'

import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, ArrowLeft, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FlowlineLogo } from '@/components/header/flowline-logo'
import { useResetPassword, passwordRules } from '@/hooks/authentification/use-reset-password'

export default function ResetPasswordPage() {
  const {
    token,
    password,
    setPassword,
    confirm,
    setConfirm,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    isLoading,
    error,
    success,
    allRulesPassed,
    passwordsMatch,
    confirmTouched,
    handleSubmit,
  } = useResetPassword()

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <FlowlineLogo />
              <span translate="no" className="text-[17px] font-bold tracking-tight text-foreground">
                Flowline
              </span>
            </Link>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-8 shadow-sm text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">Invalid or expired link</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <Link href="/forgot-password">
              <Button className="w-full mt-2">Request new link</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-8 shadow-sm">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-foreground">Password updated</h1>
                <p className="text-sm text-muted-foreground">
                  Your password has been changed successfully. Redirecting you to sign in…
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold text-foreground">Set new password</h1>
                <p className="text-sm text-muted-foreground">
                  Choose a strong password different from your previous one.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 space-y-1">
                  <p className="text-xs text-destructive">{error}</p>
                  {error.includes('expired') && (
                    <Link
                      href="/forgot-password"
                      className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Request a new reset link →
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password"
                      className="pr-10 h-10"
                      autoFocus
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {password.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {passwordRules.map((rule) => {
                        const passed = rule.test(password)
                        return (
                          <div key={rule.id} className="flex items-center gap-1.5">
                            {passed ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                            )}
                            <span
                              className={cn(
                                'text-[11px]',
                                passed
                                  ? 'text-emerald-600 dark:text-emerald-400'
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-sm">
                    Confirm new password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Confirm password"
                      className={cn(
                        'pr-10 h-10',
                        confirmTouched &&
                          !passwordsMatch &&
                          'border-destructive focus-visible:ring-destructive/30',
                      )}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmTouched && !passwordsMatch && (
                    <p className="text-[11px] text-destructive">Passwords do not match.</p>
                  )}
                  {confirmTouched && passwordsMatch && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Passwords match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!allRulesPassed || !passwordsMatch || isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    'Update password'
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
