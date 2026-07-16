'use client'

import { useState, useTransition } from 'react'
import { Check, Zap, Crown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createCheckoutSession, changeSubscriptionPlan } from '@/api/billing/actions'
import type { Plan, BillingInterval } from '@/lib/stripe'

interface BillingInfo {
  plan: Plan
  subscriptionStatus: string | null
  subscriptionId: string | null
  stripeCustomerId: string | null
  isActive: boolean
  isTrial: boolean
  trialEndsAt: Date | null
}

interface BillingClientProps {
  billing: BillingInfo | null
}

const PLANS_CONFIG = [
  {
    id: 'free' as Plan,
    name: 'Free',
    icon: null,
    price: { monthly: 0, annual: 0 },
    description: 'Get started with the essentials.',
    features: [
      '3 lists',
      '5 habits',
      '100 tasks per list',
      '80 subtasks per task',
      '80 custom tags',
      'Calendar & timer',
      'Contacts',
    ],
    cta: { upgrade: 'Current plan', downgrade: 'Downgrade to Free' },
    accent: 'border-border/60',
    badge: null,
  },
  {
    id: 'plus' as Plan,
    name: 'Plus',
    icon: Zap,
    price: { monthly: 7, annual: 72 },
    description: 'For power users who want more.',
    features: [
      'Everything in Free',
      'Unlimited lists',
      'Unlimited habits',
      'Unlimited tasks & subtasks',
      'Unlimited custom tags',
      'Priority support',
    ],
    cta: { upgrade: 'Start 7-day free trial', downgrade: 'Downgrade to Plus' },
    accent: 'border-violet-500/30',
    badge: '7-day trial',
    trial: true,
  },
  {
    id: 'pro' as Plan,
    name: 'Pro',
    icon: Crown,
    price: { monthly: 25, annual: 250 },
    description: 'For professionals who want it all.',
    features: [
      'Everything in Plus',
      'Advanced analytics',
      'Custom integrations',
      'Team features (coming soon)',
      'Early access to new features',
    ],
    cta: { upgrade: 'Upgrade to Pro', downgrade: 'Downgrade to Pro' },
    accent: 'border-amber-500/30',
    badge: 'Most powerful',
    trial: false,
  },
]

const PLAN_ORDER: Plan[] = ['free', 'plus', 'pro']

function PlanCard({
  plan,
  interval,
  currentPlan,
  hasActiveSubscription,
  isTrial,
  trialEndsAt,
}: {
  plan: (typeof PLANS_CONFIG)[number]
  interval: BillingInterval
  currentPlan: Plan
  hasActiveSubscription: boolean
  isTrial: boolean
  trialEndsAt: Date | null
}) {
  const [isPending, startTransition] = useTransition()
  const isCurrent = plan.id === currentPlan
  const currentPlanOrder = PLAN_ORDER.indexOf(currentPlan)
  const thisPlanOrder = PLAN_ORDER.indexOf(plan.id)
  const isUpgrade = thisPlanOrder > currentPlanOrder
  const isFree = plan.id === 'free'

  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const handleAction = () => {
    if (isCurrent || isFree) return
    startTransition(async () => {
      if (hasActiveSubscription) {
        await changeSubscriptionPlan(plan.id, interval)
      } else {
        await createCheckoutSession(plan.id, interval)
      }
    })
  }

  const buttonLabel = () => {
    if (isCurrent) return 'Current plan'
    if (isFree && !hasActiveSubscription) return 'Current plan'
    if (isFree) return 'Downgrade to Free'
    if (isUpgrade) return plan.cta.upgrade
    return plan.cta.downgrade
  }

  const annualSaving =
    plan.id !== 'free'
      ? Math.round(
          ((plan.price.monthly * 12 - plan.price.annual) / (plan.price.monthly * 12)) * 100,
        )
      : 0

  const Icon = plan.icon

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-card/40 p-6 transition-all',
        plan.accent,
        isCurrent && 'ring-2',
        isCurrent && plan.id === 'free' && 'ring-border/60',
        isCurrent && plan.id === 'plus' && 'ring-violet-500/30 bg-violet-500/[0.03]',
        isCurrent && plan.id === 'pro' && 'ring-amber-500/30 bg-amber-500/[0.03]',
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white',
              plan.id === 'plus' ? 'bg-violet-600' : 'bg-amber-500',
            )}
          >
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon
                className={cn('h-4 w-4', plan.id === 'plus' ? 'text-violet-500' : 'text-amber-500')}
              />
            )}
            <span className="text-sm font-semibold text-foreground">{plan.name}</span>
          </div>
          {isCurrent && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                plan.id === 'free'
                  ? 'bg-muted text-muted-foreground'
                  : plan.id === 'plus'
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              )}
            >
              {isTrial ? `Trial · ${daysLeft}d left` : 'Active'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{plan.description}</p>
      </div>

      <div className="mb-6">
        {isFree ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">€0</span>
            <span className="text-sm text-muted-foreground">/ forever</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">
                €{interval === 'monthly' ? plan.price.monthly : Math.round(plan.price.annual / 12)}
              </span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            {interval === 'annual' && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                €{plan.price.annual} billed annually
                <span
                  className={cn(
                    'ml-1.5 font-semibold',
                    plan.id === 'plus'
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  Save {annualSaving}%
                </span>
              </p>
            )}
          </>
        )}
      </div>

      <ul className="mb-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Check
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                plan.id === 'free'
                  ? 'text-muted-foreground/60'
                  : plan.id === 'plus'
                    ? 'text-violet-500'
                    : 'text-amber-500',
              )}
            />
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleAction}
        disabled={(isCurrent && !isTrial) || (isFree && !hasActiveSubscription) || isPending}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all',
          isCurrent && !isTrial
            ? plan.id === 'free'
              ? 'bg-muted/60 text-muted-foreground cursor-default'
              : plan.id === 'plus'
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 cursor-default'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 cursor-default'
            : isFree && !hasActiveSubscription
              ? 'bg-muted/60 text-muted-foreground cursor-default'
              : plan.id === 'free'
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : plan.id === 'plus'
                  ? 'bg-violet-600 text-white hover:bg-violet-500'
                  : 'bg-amber-500 text-white hover:bg-amber-400',
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
      <div className="mb-8">
        <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
          Billing
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Plans & pricing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the plan that fits your workflow.
        </p>
      </div>

      <div className="mb-8 flex justify-center">
        <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
          {(['monthly', 'annual'] as BillingInterval[]).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInterval(i)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium transition-all',
                interval === i
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {i === 'monthly' ? 'Monthly' : 'Annual'}
              {i === 'annual' && (
                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Save up to 17%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS_CONFIG.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            interval={interval}
            currentPlan={currentPlan}
            hasActiveSubscription={hasActiveSubscription}
            isTrial={billing?.isTrial ?? false}
            trialEndsAt={billing?.trialEndsAt ?? null}
          />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Payments secured by Stripe · Cancel anytime · All prices in EUR
      </p>
    </div>
  )
}
