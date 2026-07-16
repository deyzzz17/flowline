'use client'

import { useState, useTransition } from 'react'
import { Check, Zap, Crown, Loader2, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createCheckoutSession,
  changeSubscriptionPlan,
  switchToMonthlyAtRenewal,
  type BillingInfo,
} from '@/api/billing/actions'
import type { Plan, BillingInterval } from '@/lib/stripe'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
      '3 lists & 5 habits',
      '100 tasks per list',
      '80 subtasks per task',
      '80 custom tags',
      'Calendar & timer',
      'Contacts',
    ],
    accent: null,
    trialDays: null,
  },
  {
    id: 'plus' as Plan,
    name: 'Plus',
    icon: Zap,
    price: { monthly: 7, annual: 72 },
    description: 'For power users who want more.',
    features: [
      'Everything in Free',
      'Unlimited lists & habits',
      'Unlimited tasks & subtasks',
      'Unlimited custom tags',
      'Priority support',
    ],
    accent: 'violet',
    trialDays: 14,
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
    accent: 'amber',
    trialDays: 7,
  },
]

const PLAN_ORDER: Plan[] = ['free', 'plus', 'pro']

type CardAction =
  | 'checkout'
  | 'upgrade_plan' 
  | 'downgrade_plan'
  | 'switch_to_annual' 
  | 'switch_to_monthly_at_renewal'
  | 'switch_to_monthly_now'
  | 'current' 
  | 'downgrade_to_free' 

function getCardAction(
  planId: Plan,
  interval: BillingInterval,
  billing: BillingInfo | null,
): CardAction {
  const currentPlan = billing?.plan ?? 'free'
  const currentInterval = billing?.billingInterval
  const hasActiveSubscription = !!(billing?.subscriptionId && billing?.isActive)

  if (!hasActiveSubscription) {
    if (planId === 'free') return 'current'
    return 'checkout'
  }

  if (planId === 'free') return 'downgrade_to_free'

  const thisPlanOrder = PLAN_ORDER.indexOf(planId)
  const currentPlanOrder = PLAN_ORDER.indexOf(currentPlan)

  if (planId === currentPlan) {
    if (interval === currentInterval) return 'current'
    if (interval === 'annual' && currentInterval === 'monthly') return 'switch_to_annual'
    if (interval === 'monthly' && currentInterval === 'annual') {
      return 'switch_to_monthly_at_renewal'
    }
  }

  if (thisPlanOrder > currentPlanOrder) return 'upgrade_plan'
  return 'downgrade_plan'
}

function PlanCard({
  plan,
  interval,
  billing,
  onAction,
}: {
  plan: (typeof PLANS_CONFIG)[number]
  interval: BillingInterval
  billing: BillingInfo | null
  onAction: (action: CardAction, planId: Plan, interval: BillingInterval) => void
}) {
  const action = getCardAction(plan.id, interval, billing)
  const isCurrent = action === 'current'
  const isFree = plan.id === 'free'

  const hadTrial = plan.id === 'plus' ? billing?.hadPlusTrial : billing?.hadProTrial
  const trialDays = !hadTrial ? plan.trialDays : null

  const daysLeft = billing?.trialEndsAt
    ? Math.max(0, Math.ceil((billing.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const annualSaving =
    plan.id !== 'free'
      ? Math.round(
          ((plan.price.monthly * 12 - plan.price.annual) / (plan.price.monthly * 12)) * 100,
        )
      : 0

  const Icon = plan.icon

  const buttonLabel = () => {
    switch (action) {
      case 'current':
        return 'Current plan'
      case 'checkout':
        return trialDays ? `Start ${trialDays}-day free trial` : `Get ${plan.name}`
      case 'upgrade_plan':
        return `Upgrade to ${plan.name}`
      case 'downgrade_plan':
        return `Downgrade to ${plan.name}`
      case 'switch_to_annual':
        return 'Switch to annual billing'
      case 'switch_to_monthly_at_renewal':
        return 'Switch to monthly billing'
      case 'switch_to_monthly_now':
        return 'Switch to monthly billing'
      case 'downgrade_to_free':
        return 'Downgrade to Free'
      default:
        return plan.name
    }
  }

  const buttonDisabled = isCurrent

  const accentColor =
    plan.accent === 'violet'
      ? {
          ring: 'ring-violet-500/30',
          bg: 'bg-violet-500/[0.03]',
          badge: 'bg-violet-600',
          text: 'text-violet-600 dark:text-violet-400',
          check: 'text-violet-500',
          btn: 'bg-violet-600 hover:bg-violet-500 text-white',
          currentBadge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        }
      : plan.accent === 'amber'
        ? {
            ring: 'ring-amber-500/30',
            bg: 'bg-amber-500/[0.03]',
            badge: 'bg-amber-500',
            text: 'text-amber-600 dark:text-amber-400',
            check: 'text-amber-500',
            btn: 'bg-amber-500 hover:bg-amber-400 text-white',
            currentBadge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          }
        : {
            ring: 'ring-border/60',
            bg: '',
            badge: 'bg-muted',
            text: 'text-muted-foreground',
            check: 'text-muted-foreground/60',
            btn: 'bg-muted text-foreground hover:bg-muted/80',
            currentBadge: 'bg-muted text-muted-foreground',
          }

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-card/40 p-6 transition-all',
        plan.accent === 'violet'
          ? 'border-violet-500/30'
          : plan.accent === 'amber'
            ? 'border-amber-500/30'
            : 'border-border/60',
        isCurrent && `ring-2 ${accentColor.ring} ${accentColor.bg}`,
      )}
    >
      {plan.id === 'pro' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Most powerful
          </span>
        </div>
      )}
      {plan.id === 'plus' && trialDays && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {trialDays}-day free trial
          </span>
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className={cn('h-4 w-4', accentColor.text)} />}
            <span className="text-sm font-semibold text-foreground">{plan.name}</span>
          </div>
          {isCurrent && billing?.isTrial && daysLeft !== null && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                accentColor.currentBadge,
              )}
            >
              Trial · {daysLeft}d left
            </span>
          )}
          {isCurrent && !billing?.isTrial && plan.id !== 'free' && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                accentColor.currentBadge,
              )}
            >
              Active
            </span>
          )}
          {isCurrent && plan.id === 'free' && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Active
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
        ) : interval === 'monthly' ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">€{plan.price.monthly}</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Cancel anytime</p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">€{plan.price.annual}</span>
              <span className="text-sm text-muted-foreground">/ year</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ~€{Math.round(plan.price.annual / 12)}/month ·{' '}
              <span className={cn('font-semibold', accentColor.text)}>Save {annualSaving}%</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              12-month commitment · non-refundable
            </p>
          </>
        )}
      </div>

      <ul className="mb-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Check className={cn('mt-0.5 h-4 w-4 shrink-0', accentColor.check)} />
            {feature}
          </li>
        ))}
      </ul>

      {!isCurrent && !isFree && trialDays && (
        <p className={cn('mb-3 text-center text-xs font-medium', accentColor.text)}>
          {trialDays} days free, then €
          {interval === 'monthly' ? plan.price.monthly : plan.price.annual}/
          {interval === 'monthly' ? 'mo' : 'yr'}
        </p>
      )}
      {!isCurrent && !isFree && !trialDays && hadTrial && (
        <p className="mb-3 text-center text-xs text-muted-foreground/60">Trial already used</p>
      )}

      <button
        type="button"
        onClick={() => onAction(action, plan.id, interval)}
        disabled={buttonDisabled}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-default',
          buttonDisabled
            ? cn(
                'cursor-default',
                plan.id === 'free'
                  ? 'bg-muted/60 text-muted-foreground'
                  : action === 'current'
                    ? accentColor.btn
                    : 'bg-muted/60 text-muted-foreground',
              )
            : plan.id === 'free'
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : accentColor.btn,
        )}
      >
        {buttonLabel()}
      </button>
    </div>
  )
}

export function BillingClient({ billing }: BillingClientProps) {
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [isPending, startTransition] = useTransition()
  const [annualCommitmentDialog, setAnnualCommitmentDialog] = useState<{
    planId: Plan
    interval: BillingInterval
    isNew: boolean
  } | null>(null)
  const [monthlySwitch, setMonthlySwitch] = useState<{ planId: Plan } | null>(null)

  const handleAction = (action: CardAction, planId: Plan, iv: BillingInterval) => {
    if (action === 'current') return

    if (
      iv === 'annual' &&
      (action === 'checkout' || action === 'upgrade_plan' || action === 'switch_to_annual')
    ) {
      setAnnualCommitmentDialog({ planId, interval: iv, isNew: action !== 'switch_to_annual' })
      return
    }

    if (action === 'switch_to_monthly_at_renewal') {
      setMonthlySwitch({ planId })
      return
    }

    startTransition(async () => {
      if (action === 'checkout') {
        await createCheckoutSession(planId, iv)
      } else if (
        action === 'upgrade_plan' ||
        action === 'downgrade_plan' ||
        action === 'switch_to_annual'
      ) {
        await changeSubscriptionPlan(planId, iv)
      } else if (action === 'downgrade_to_free') {
        await import('@/api/billing/actions').then((m) => m.createPortalSession())
      }
    })
  }

  const handleConfirmAnnual = () => {
    if (!annualCommitmentDialog) return
    const { planId, interval: iv, isNew } = annualCommitmentDialog
    setAnnualCommitmentDialog(null)
    startTransition(async () => {
      if (isNew) {
        await createCheckoutSession(planId, iv)
      } else {
        await changeSubscriptionPlan(planId, iv)
      }
    })
  }

  const handleSwitchAtRenewal = () => {
    if (!monthlySwitch) return
    const { planId } = monthlySwitch
    setMonthlySwitch(null)
    startTransition(async () => {
      await switchToMonthlyAtRenewal(planId)
    })
  }

  const handleSwitchNow = () => {
    if (!monthlySwitch) return
    setMonthlySwitch(null)
    startTransition(async () => {
      await import('@/api/billing/actions').then((m) => m.createPortalSession())
    })
  }

  const periodEndFormatted = billing?.periodEnd
    ? billing.periodEnd.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <>
      <AlertDialog
        open={!!annualCommitmentDialog}
        onOpenChange={(v) => {
          if (!v) setAnnualCommitmentDialog(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Annual commitment
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-1">
              <span className="block">
                By choosing the annual plan, you agree to a 12-month commitment:
              </span>
              <ul className="space-y-1 text-sm">
                <li>• You will be charged the full annual amount upfront</li>
                <li>
                  • This payment is <strong>non-refundable</strong> if you cancel early
                </li>
                <li>• You will keep access until the end of your paid period</li>
                <li>• Auto-renewal can be disabled anytime from billing settings</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAnnual}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm annual plan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!monthlySwitch}
        onOpenChange={(v) => {
          if (!v) setMonthlySwitch(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="h-4 w-4 text-violet-500" />
              Switch to monthly billing
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-1">
              <span className="block">
                You currently have an active annual subscription
                {periodEndFormatted ? ` until ${periodEndFormatted}` : ''}. How would you like to
                switch?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2 space-y-3">
            <button
              type="button"
              onClick={handleSwitchAtRenewal}
              disabled={isPending}
              className="w-full rounded-xl border border-border/60 bg-background p-4 text-left transition-colors hover:bg-muted/30 disabled:opacity-50"
            >
              <p className="text-sm font-semibold text-foreground">Switch at renewal</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Keep your annual plan until {periodEndFormatted ?? 'it ends'}, then automatically
                switch to monthly. No money lost.
              </p>
            </button>
            <button
              type="button"
              onClick={handleSwitchNow}
              disabled={isPending}
              className="w-full rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-left transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              <p className="text-sm font-semibold text-destructive">Cancel now & switch</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cancel your annual plan immediately (no refund) and start a new monthly
                subscription.
              </p>
            </button>
          </div>
          <AlertDialogFooter className="px-6 pb-6">
            <AlertDialogCancel>Keep annual plan</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

        <div
          className={cn(
            'grid grid-cols-1 gap-4 sm:grid-cols-3',
            isPending && 'opacity-60 pointer-events-none',
          )}
        >
          {PLANS_CONFIG.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              interval={interval}
              billing={billing}
              onAction={handleAction}
            />
          ))}
        </div>

        {isPending && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to Stripe...
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Payments secured by Stripe · All prices in EUR
        </p>
      </div>
    </>
  )
}
