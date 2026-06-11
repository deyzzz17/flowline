'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChangePassword } from '@/hooks/profile/use-change-password'

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
    { label: 'Special char', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.pass).length

  const bar =
    score <= 1
      ? { width: '25%', color: 'bg-destructive' }
      : score === 2
        ? { width: '50%', color: 'bg-amber-500' }
        : score === 3
          ? { width: '75%', color: 'bg-blue-500' }
          : { width: '100%', color: 'bg-emerald-500' }

  const label =
    score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'

  return (
    <div className="space-y-1.5">
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-300', bar.color)}
          style={{ width: bar.width }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {checks.map((c) => (
            <span
              key={c.label}
              className={cn(
                'text-[10px] font-medium',
                c.pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/50',
              )}
            >
              {c.pass ? '✓' : '·'} {c.label}
            </span>
          ))}
        </div>
        <span
          className={cn(
            'text-[10px] font-semibold',
            score <= 1
              ? 'text-destructive'
              : score === 2
                ? 'text-amber-500'
                : score === 3
                  ? 'text-blue-500'
                  : 'text-emerald-500',
          )}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 pr-10 rounded-xl border-border/60 text-sm focus-visible:ring-violet-500/30"
        autoComplete={id === 'current-password' ? 'current-password' : 'new-password'}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const {
    currentPassword, newPassword, confirmPassword,
    isLoading, error, success, isValid,
    set, reset, handleSubmit,
  } = useChangePassword(() => onOpenChange(false))

  const handleOpenChange = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-violet-500" />
            Change password
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-foreground">Password updated</p>
            <p className="text-xs text-muted-foreground">
              All other sessions have been signed out for your security.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current password
              </Label>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(v) => set({ currentPassword: v, error: null })}
                placeholder="Enter your current password"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                New password
              </Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(v) => set({ newPassword: v, error: null })}
                placeholder="At least 8 characters"
                disabled={isLoading}
              />
              <PasswordStrength password={newPassword} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Confirm new password
              </Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(v) => set({ confirmPassword: v, error: null })}
                placeholder="Repeat your new password"
                disabled={isLoading}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-destructive">Passwords do not match.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                className="gap-2 bg-violet-600 hover:bg-violet-500 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-3.5 w-3.5" />
                    Update password
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}