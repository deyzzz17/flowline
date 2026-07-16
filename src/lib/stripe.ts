import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-06-24.dahlia',
  typescript: true,
})

export type Plan = 'free' | 'plus' | 'pro'
export type BillingInterval = 'monthly' | 'annual'

export const PLANS: Record<
  Plan,
  {
    name: string
    priceId: Record<BillingInterval, string | null>
    trialDays: number | null
  }
> = {
  free: {
    name: 'Free',
    priceId: { monthly: null, annual: null },
    trialDays: null,
  },
  plus: {
    name: 'Plus',
    priceId: {
      monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY ?? '',
      annual: process.env.STRIPE_PRICE_PLUS_ANNUAL ?? '',
    },
    trialDays: 14,
  },
  pro: {
    name: 'Pro',
    priceId: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
      annual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? '',
    },
    trialDays: 7,
  },
}

export function getPlanFromPriceId(priceId: string): Plan {
  if (
    priceId === process.env.STRIPE_PRICE_PLUS_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PLUS_ANNUAL
  ) {
    return 'plus'
  }
  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO_ANNUAL
  ) {
    return 'pro'
  }
  return 'free'
}
