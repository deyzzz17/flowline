'use client'

import { useTransition } from 'react'
import { Zap, Crown, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createPortalSession } from '@/api/billing/actions'
import Link from 'next/link'
import type { Plan } from '@/lib/stripe'

interface BillingInfo {
  plan: Plan
  subscriptionStatus: string | null
  stripeCustomerId: string | null
  isActive: boolean
  isTrial: boolean
  trialEndsAt: Date | null
  billingInterval?: 'monthly' | 'annual' | null
  periodEnd?: Date | null
}

const PLAN_META: Record<Plan, { label: string; description: string; color: string }> = {
  free: {
    label: 'Free',
    description: 'Basic access with limited features.',
    color: 'text-muted-foreground',
  },
  plus: {
    label: 'Plus',
    description: 'Unlimited personal usage, AI Assistant, shared lists and more.',
    color: 'text-violet-600 dark:text-violet-400',
  },
  pro: {
    label: 'Pro',
    description: 'Everything in Plus — AI Coach, unlimited collaboration, advanced integrations.',
    color: 'text-amber-600 dark:text-amber-400',
  },
}

export function SubscriptionSection({ billing }: { billing?: BillingInfo | null }) {
  const [isPending, startTransition] = useTransition()
  const plan = billing?.plan ?? 'free'
  const meta = PLAN_META[plan]
  const isPayingUser = billing?.isActive && plan !== 'free'

  const daysLeft = billing?.trialEndsAt
    ? Math.max(0, Math.ceil((billing.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const periodEndFormatted = billing?.periodEnd
    ? billing.periodEnd.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const handleCancel = () => {
    startTransition(async () => {
      await createPortalSession()
    })
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {plan === 'plus' && <Zap className="h-4 w-4 text-violet-500 shrink-0" />}
            {plan === 'pro' && <Crown className="h-4 w-4 text-amber-500 shrink-0" />}
            <span className={cn('text-sm font-semibold', meta.color)}>
              {meta.label}
              {billing?.isTrial && daysLeft !== null && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  · Trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                </span>
              )}
              {!billing?.isTrial && plan !== 'free' && billing?.billingInterval && (
                <span className="ml-2 text-xs font-normal text-muted-foreground capitalize">
                  · {billing.billingInterval}
                </span>
              )}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
          {periodEndFormatted && !billing?.isTrial && (
            <p className="mt-1 text-xs text-muted-foreground/60">Renews {periodEndFormatted}</p>
          )}
          {billing?.subscriptionStatus === 'past_due' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive font-medium">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Payment failed — update your payment method
            </div>
          )}
        </div>

        <div className="shrink-0 mt-0.5">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
              billing?.isTrial
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                : plan === 'pro'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : plan === 'plus'
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    : 'bg-muted text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                billing?.isTrial
                  ? 'bg-violet-500'
                  : plan !== 'free'
                    ? plan === 'pro'
                      ? 'bg-amber-500'
                      : 'bg-violet-500'
                    : 'bg-muted-foreground/40',
              )}
            />
            {billing?.isTrial ? 'Trial' : isPayingUser ? 'Active' : 'Free'}
          </span>
        </div>
      </div>

      <div className="border-t border-border/50" />

      <div className="px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {plan !== 'pro' && (
          <Link
            href="/billing"
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors',
              plan === 'free'
                ? 'bg-violet-600 text-white hover:bg-violet-500'
                : 'bg-amber-500 text-white hover:bg-amber-400',
            )}
          >
            {plan === 'free' ? (
              <>
                <Zap className="h-4 w-4" />
                Upgrade your plan
              </>
            ) : (
              <>
                <Crown className="h-4 w-4" />
                Upgrade to Pro
              </>
            )}
            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
          </Link>
        )}

        {plan === 'pro' && (
          <Link
            href="/billing"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            View plans
            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
          </Link>
        )}

        {isPayingUser && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive disabled:opacity-50 sm:flex-none"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Cancel subscription
          </button>
        )}
      </div>
    </div>
  )
}
