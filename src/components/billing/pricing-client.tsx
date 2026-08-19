'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { BillingInterval } from '@/lib/stripe'
import { PLANS_CONFIG } from '@/components/billing/plans-config'

function PricingCard({
  plan,
  interval,
}: {
  plan: (typeof PLANS_CONFIG)[number]
  interval: BillingInterval
}) {
  const isFree = plan.id === 'free'
  const href = isFree ? '/sign-up' : `/sign-up?redirectTo=${encodeURIComponent('/billing')}`

  const annualSaving =
    plan.id !== 'free'
      ? Math.round(
          ((plan.price.monthly * 12 - plan.price.annual) / (plan.price.monthly * 12)) * 100,
        )
      : 0

  const Icon = plan.icon

  const ctaLabel = isFree
    ? 'Get started free'
    : plan.trialDays
      ? `Start ${plan.trialDays}-day free trial`
      : `Get ${plan.name}`

  const accentColor =
    plan.accent === 'violet'
      ? {
          text: 'text-violet-600 dark:text-violet-400',
          check: 'text-violet-500',
          btn: 'bg-violet-600 hover:bg-violet-500 text-white',
        }
      : plan.accent === 'amber'
        ? {
            text: 'text-amber-600 dark:text-amber-400',
            check: 'text-amber-500',
            btn: 'bg-amber-500 hover:bg-amber-400 text-white',
          }
        : {
            text: 'text-muted-foreground',
            check: 'text-muted-foreground/60',
            btn: 'bg-muted text-foreground hover:bg-muted/80',
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
      )}
    >
      {plan.id === 'pro' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Most powerful
          </span>
        </div>
      )}
      {plan.id === 'plus' && plan.trialDays && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {plan.trialDays}-day free trial
          </span>
        </div>
      )}

      <div className="mb-5">
        <div className="mb-1 flex items-center gap-2">
          {Icon && <Icon className={cn('h-4 w-4', accentColor.text)} />}
          <span className="text-sm font-semibold text-foreground">{plan.name}</span>
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

      {!isFree && plan.trialDays && (
        <p className={cn('mb-3 text-center text-xs font-medium', accentColor.text)}>
          {plan.trialDays} days free, then €
          {interval === 'monthly' ? plan.price.monthly : plan.price.annual}/
          {interval === 'monthly' ? 'mo' : 'yr'}
        </p>
      )}

      <Link
        href={href}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all',
          isFree ? 'bg-muted text-foreground hover:bg-muted/80' : accentColor.btn,
        )}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}

export function PricingClient() {
  const [interval, setInterval] = useState<BillingInterval>('monthly')

  return (
    <div>
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
          <PricingCard key={plan.id} plan={plan} interval={interval} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Payments secured by Stripe · All prices in EUR
      </p>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-6 text-center">
        <p className="text-sm font-semibold text-foreground">Are you a business?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Need a custom plan for your team or organization? We&apos;d love to help.
        </p>
        <a
          href="mailto:contact@flowline.app"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border/60 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Contact us for a custom quote
        </a>
      </div>
    </div>
  )
}
