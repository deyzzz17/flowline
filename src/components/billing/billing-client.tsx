'use client'

import { useState, useTransition } from 'react'
import { Check, Zap, Crown, Loader2, ExternalLink, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createCheckoutSession,
  createPortalSession,
  changeSubscriptionPlan,
} from '@/api/billing/actions'
import type { Plan, BillingInterval } from '@/lib/stripe'

interface BillingInfo {
  plan: Plan
  subscriptionStatus: string | null
  subscriptionId: string | null
  stripeCustomerId: string | null
  trialEndsAt: Date | null
  isActive: boolean
  isTrial: boolean
}

interface BillingClientProps {
  billing: BillingInfo | null
}

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: [
    '3 lists',
    '5 habits',
    '100 tasks per list',
    '80 subtasks per task',
    '80 custom tags',
    'Calendar & timer',
  ],
  plus: [
    'Everything in Free',
    'Unlimited lists',
    'Unlimited habits',
    'Unlimited tasks',
    'Priority support',
    '7-day free trial',
  ],
  pro: [
    'Everything in Plus',
    'Advanced analytics',
    'Custom integrations',
    'Team features (coming soon)',
    'Priority support',
    'Early access to new features',
  ],
}

const PLAN_PRICES: Record<Plan, Record<BillingInterval, string>> = {
  free: { monthly: 'Free', annual: 'Free' },
  plus: { monthly: '$7', annual: '$72' },
  pro: { monthly: '$25', annual: '$264' },
}

function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === 'free') return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
        plan === 'plus'
          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      )}
    >
      {plan === 'plus' ? <Zap className="h-2.5 w-2.5" /> : <Crown className="h-2.5 w-2.5" />}
      {plan === 'plus' ? 'Plus' : 'Pro'}
    </span>
  )
}

function CurrentPlanCard({ billing }: { billing: BillingInfo | null }) {
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
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
            Current plan
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-2xl font-bold text-foreground capitalize">{plan}</h2>
            <PlanBadge plan={plan} />
          </div>
          {billing?.isTrial && daysLeft !== null && (
            <p className="mt-1 text-xs text-violet-600 dark:text-violet-400 font-medium">
              Trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
            </p>
          )}
          {billing?.subscriptionStatus === 'past_due' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Payment failed — please update your payment method
            </div>
          )}
          {billing?.subscriptionStatus === 'canceled' && (
            <p className="mt-1 text-xs text-muted-foreground">
              Your subscription has been canceled.
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
            Manage billing
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
    </div>
  )
}

function PlanCard({
  plan,
  interval,
  currentPlan,
  hasActiveSubscription,
}: {
  plan: Plan
  interval: BillingInterval
  currentPlan: Plan
  hasActiveSubscription: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const isCurrent = plan === currentPlan
  const isUpgrade =
    (currentPlan === 'free' && (plan === 'plus' || plan === 'pro')) ||
    (currentPlan === 'plus' && plan === 'pro')
  const isDowngrade = currentPlan === 'pro' && plan === 'plus'

  if (plan === 'free') return null

  const handleAction = () => {
    startTransition(async () => {
      if (hasActiveSubscription && !isCurrent) {
        await changeSubscriptionPlan(plan, interval)
      } else if (!isCurrent) {
        await createCheckoutSession(plan, interval)
      }
    })
  }

  const buttonLabel = () => {
    if (isCurrent) return 'Current plan'
    if (isUpgrade) return plan === 'plus' ? 'Start free trial' : 'Upgrade to Pro'
    if (isDowngrade) return 'Downgrade to Plus'
    return 'Get started'
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-5 sm:p-6 space-y-5 transition-all',
        plan === 'pro'
          ? 'border-amber-500/30 bg-amber-500/5'
          : isCurrent
            ? 'border-violet-500/30 bg-violet-500/5'
            : 'border-border/60 bg-card/40',
      )}
    >
      {plan === 'pro' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wide">
            Most powerful
          </span>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-1">
          {plan === 'plus' ? (
            <Zap className="h-4 w-4 text-violet-500" />
          ) : (
            <Crown className="h-4 w-4 text-amber-500" />
          )}
          <p className="text-sm font-semibold text-foreground capitalize">{plan}</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{PLAN_PRICES[plan][interval]}</span>
          <span className="text-xs text-muted-foreground">
            /{interval === 'monthly' ? 'mo' : 'yr'}
          </span>
        </div>
        {plan === 'plus' && interval === 'monthly' && (
          <p className="mt-0.5 text-[11px] text-violet-600 dark:text-violet-400 font-medium">
            7-day free trial included
          </p>
        )}
        {plan === 'plus' && interval === 'annual' && (
          <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Save ~28% vs monthly
          </p>
        )}
        {plan === 'pro' && interval === 'annual' && (
          <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Save ~28% vs monthly
          </p>
        )}
      </div>

      <ul className="space-y-2">
        {PLAN_FEATURES[plan].map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check
              className={cn(
                'h-4 w-4 shrink-0 mt-0.5',
                plan === 'pro' ? 'text-amber-500' : 'text-violet-500',
              )}
            />
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleAction}
        disabled={isCurrent || isPending}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all',
          isCurrent
            ? 'bg-muted text-muted-foreground cursor-default'
            : plan === 'pro'
              ? 'bg-amber-500 text-white hover:bg-amber-400'
              : 'bg-violet-600 text-white hover:bg-violet-500',
          isPending && 'opacity-70',
        )}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {buttonLabel()}
      </button>
    </div>
  )
}

export function BillingClient({ billing }: BillingClientProps) {
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const currentPlan = billing?.plan ?? 'free'
  const hasActiveSubscription = !!(billing?.subscriptionId && billing?.isActive)

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
          Billing
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Plans & subscription</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your Flowline subscription and billing.
        </p>
      </div>

      <div className="space-y-6">
        <CurrentPlanCard billing={billing} />

        <div className="flex justify-center">
          <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
            {(['monthly', 'annual'] as BillingInterval[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInterval(i)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-xs font-medium transition-all',
                  interval === i
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {i === 'monthly' ? 'Monthly' : 'Annual'}
                {i === 'annual' && (
                  <span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    -28%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PlanCard
            plan="plus"
            interval={interval}
            currentPlan={currentPlan}
            hasActiveSubscription={hasActiveSubscription}
          />
          <PlanCard
            plan="pro"
            interval={interval}
            currentPlan={currentPlan}
            hasActiveSubscription={hasActiveSubscription}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Payments secured by Stripe. Cancel anytime from the billing portal.
        </p>
      </div>
    </div>
  )
}
