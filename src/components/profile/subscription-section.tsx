'use client'

import { useTransition } from 'react'
import { Zap, Crown, CreditCard, ExternalLink, Loader2, Check } from 'lucide-react'
import { createPortalSession } from '@/api/billing/actions'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Plan } from '@/lib/stripe'

interface BillingInfo {
  plan: Plan
  subscriptionStatus: string | null
  stripeCustomerId: string | null
  isActive: boolean
  isTrial: boolean
  trialEndsAt: Date | null
}

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: ['3 lists', '5 habits', '100 tasks per list', 'Calendar & timer'],
  plus: ['Unlimited lists', 'Unlimited habits', 'Unlimited tasks', 'Priority support'],
  pro: ['Everything in Plus', 'Advanced analytics', 'Early access to new features'],
}

export function SubscriptionSection({ billing }: { billing?: BillingInfo | null }) {
  const plan = billing?.plan ?? 'free'
  const [isPending, startTransition] = useTransition()

  const handlePortal = () => {
    startTransition(async () => {
      await createPortalSession()
    })
  }

  const daysLeft = billing?.trialEndsAt
    ? Math.max(0, Math.ceil((billing.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {plan === 'plus' && <Zap className="h-4 w-4 text-violet-500" />}
            {plan === 'pro' && <Crown className="h-4 w-4 text-amber-500" />}
            {plan === 'free' && <CreditCard className="h-4 w-4 text-muted-foreground" />}
            <p className="text-sm font-semibold text-foreground capitalize">
              {plan === 'free' ? 'Free plan' : `${plan} plan`}
            </p>
            {plan !== 'free' && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  plan === 'plus'
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                )}
              >
                {billing?.isTrial ? 'Trial' : 'Active'}
              </span>
            )}
          </div>
          {billing?.isTrial && daysLeft !== null && (
            <p className="text-xs text-violet-600 dark:text-violet-400">
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your trial
            </p>
          )}
          {billing?.subscriptionStatus === 'past_due' && (
            <p className="text-xs text-destructive font-medium">
              Payment failed — update your payment method
            </p>
          )}
        </div>

        {billing?.stripeCustomerId && (
          <button
            type="button"
            onClick={handlePortal}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 shrink-0"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ExternalLink className="h-3.5 w-3.5" />
            )}
            Manage
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PLAN_FEATURES[plan].map((feature) => (
          <span
            key={feature}
            className="flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
          >
            <Check className="h-3 w-3 text-emerald-500 shrink-0" />
            {feature}
          </span>
        ))}
      </div>

      {plan !== 'pro' && (
        <Link
          href="/billing"
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors',
            plan === 'free'
              ? 'bg-violet-600 text-white hover:bg-violet-500'
              : 'bg-amber-500 text-white hover:bg-amber-400',
          )}
        >
          {plan === 'free' ? (
            <>
              <Zap className="h-4 w-4" />
              Upgrade to Plus — 7 days free
            </>
          ) : (
            <>
              <Crown className="h-4 w-4" />
              Upgrade to Pro
            </>
          )}
        </Link>
      )}
    </div>
  )
}
