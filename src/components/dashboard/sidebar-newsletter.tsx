'use client'

import { X, Mail, Check, Loader2, ShieldAlert, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useNewsletter } from '@/hooks/newsletter/use-newletter'

export const SidebarNewsletter = () => {
  const {
    email,
    setEmail,
    isLoading,
    error,
    isValidEmail,
    isAccountEmail,
    isVisible,
    subscribed,
    isEmailVerified,
    dismiss,
    subscribe,
  } = useNewsletter()

  if (!isVisible) return null

  if (subscribed) {
    return (
      <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                You&apos;re subscribed, thank you! 🎉
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                You&apos;ll receive updates on new features and improvements.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  if (!isEmailVerified) {
    return (
      <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Mail className="h-3 w-3 text-amber-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">Newsletter</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-start gap-2 mb-3">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-600/80 dark:text-amber-400/70 leading-relaxed">
            Verify your email address to subscribe to the newsletter.
          </p>
        </div>
        <Link href="/profile">
          <Button
            size="sm"
            className="w-full h-8 text-xs gap-1.5 bg-amber-500 hover:bg-amber-400 text-white border-0"
          >
            <ShieldAlert className="h-3 w-3" />
            Verify email
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-3 rounded-xl border border-border/60 bg-card/40 p-3.5">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
            <Mail className="h-3 w-3 text-violet-500" />
          </div>
          <p className="text-xs font-semibold text-foreground">Newsletter</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        Get updates on new features and improvements.
      </p>
      {error && (
        <div className="mb-2 flex items-center gap-1.5 text-[10px] text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}
      <form onSubmit={subscribe} className="space-y-2">
        <div className="space-y-1">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={`h-8 text-xs ${!isAccountEmail && email ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
          />
          {!isAccountEmail && email && (
            <p className="text-[10px] text-destructive flex items-center gap-1">
              <AlertCircle className="h-2.5 w-2.5 shrink-0" />
              Must match your account email.
            </p>
          )}
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!isValidEmail || !isAccountEmail || isLoading}
          className="w-full h-8 text-xs gap-1.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Subscribing...
            </>
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
    </div>
  )
}
