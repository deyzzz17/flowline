'use client'

import { X, Mail, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNewsletter } from '@/hooks/newsletter/use-newletter'

export const SidebarNewsletter = () => {
  const {
    email,
    setEmail,
    isLoading,
    error,
    isValidEmail,
    isVisible,
    subscribed,
    dismiss,
    subscribe,
  } = useNewsletter()

  if (!isVisible) return null

  if (subscribed) {
    return (
      <div className="absolute bottom-full left-0 right-0 mx-3 mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <Check className="h-3 w-3 text-emerald-500" />
          </div>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            You&apos;re subscribed!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-3 mb-3 rounded-xl border border-border/60 bg-card/40 p-3.5">
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
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        Get updates on new features and improvements.
      </p>

      {error && <p className="mb-2 text-[10px] text-destructive">{error}</p>}

      <form onSubmit={subscribe} className="space-y-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="h-8 text-xs"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!isValidEmail || isLoading}
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
