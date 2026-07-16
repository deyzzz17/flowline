'use server'

import 'server-only'
import { redirect } from 'next/navigation'
import { stripe, PLANS, type Plan, type BillingInterval } from '@/lib/stripe'
import { getSession } from '@/lib/get-session'
import { Pool } from 'pg'
import { ok, err } from '@/types/result'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export interface BillingInfo {
  plan: Plan
  billingInterval: BillingInterval | null
  subscriptionStatus: string | null
  subscriptionId: string | null
  stripeCustomerId: string | null
  isActive: boolean
  isTrial: boolean
  trialEndsAt: Date | null
  periodEnd: Date | null
  hadPlusTrial: boolean
  hadProTrial: boolean
}

export const getBillingInfo = async (): Promise<BillingInfo | null> => {
  const userId = await getUserId()
  if (!userId) return null

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(
      `SELECT plan, "subscriptionStatus", "subscriptionId", "stripeCustomerId",
              "trialEndsAt", "hadPlusTrial", "hadProTrial"
       FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]

    let billingInterval: BillingInterval | null = null
    let periodEnd: Date | null = null

    if (row.subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(row.subscriptionId)
        const priceId = sub.items.data[0]?.price.id
        if (priceId) {
          const price = await stripe.prices.retrieve(priceId)
          billingInterval = price.recurring?.interval === 'year' ? 'annual' : 'monthly'
        }
        if ('current_period_end' in sub && sub.current_period_end) {
          periodEnd = new Date((sub.current_period_end as number) * 1000)
        }
      } catch {}
    }

    return {
      plan: (row.plan ?? 'free') as Plan,
      billingInterval,
      subscriptionStatus: row.subscriptionStatus,
      subscriptionId: row.subscriptionId,
      stripeCustomerId: row.stripeCustomerId,
      isActive: row.subscriptionStatus === 'active' || row.subscriptionStatus === 'trialing',
      isTrial: row.subscriptionStatus === 'trialing',
      trialEndsAt: row.trialEndsAt ? new Date(row.trialEndsAt) : null,
      periodEnd,
      hadPlusTrial: row.hadPlusTrial ?? false,
      hadProTrial: row.hadProTrial ?? false,
    }
  } finally {
    await pool.end()
  }
}

async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string,
): Promise<string> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(`SELECT "stripeCustomerId" FROM "user" WHERE id = $1 LIMIT 1`, [
      userId,
    ])
    const existingId = result.rows[0]?.stripeCustomerId
    if (existingId) return existingId

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    })

    await pool.query(`UPDATE "user" SET "stripeCustomerId" = $1 WHERE id = $2`, [
      customer.id,
      userId,
    ])

    return customer.id
  } finally {
    await pool.end()
  }
}

async function hasUsedTrial(userId: string, plan: Plan): Promise<boolean> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const field = plan === 'plus' ? 'hadPlusTrial' : 'hadProTrial'
    const result = await pool.query(`SELECT "${field}" FROM "user" WHERE id = $1 LIMIT 1`, [userId])
    return result.rows[0]?.[field] ?? false
  } finally {
    await pool.end()
  }
}

export async function markTrialUsed(userId: string, plan: Plan) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const field = plan === 'plus' ? '"hadPlusTrial"' : '"hadProTrial"'
    await pool.query(`UPDATE "user" SET ${field} = TRUE WHERE id = $1`, [userId])
  } finally {
    await pool.end()
  }
}

export const createCheckoutSession = async (plan: Plan, interval: BillingInterval) => {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')

  const { id: userId, email, name } = session.user
  const planConfig = PLANS[plan]
  const priceId = planConfig.priceId[interval]

  if (!priceId) return err('Invalid plan or interval')

  const customerId = await getOrCreateStripeCustomer(userId, email, name ?? '')
  const trialAlreadyUsed = await hasUsedTrial(userId, plan)
  const trialDays = !trialAlreadyUsed ? planConfig.trialDays : null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: trialDays ?? undefined,
      metadata: { userId, plan },
    },
    success_url: `${appUrl}/billing?success=true`,
    cancel_url: `${appUrl}/billing?canceled=true`,
    metadata: { userId, plan },
  })

  if (!checkoutSession.url) return err('Failed to create checkout session')
  redirect(checkoutSession.url)
}

export const createPortalSession = async () => {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')

  const billing = await getBillingInfo()
  if (!billing?.stripeCustomerId) return err('No Stripe customer found')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${appUrl}/profile`,
  })

  redirect(portalSession.url)
}

export const changeSubscriptionPlan = async (newPlan: Plan, interval: BillingInterval) => {
  const billing = await getBillingInfo()
  if (!billing?.subscriptionId) return err('No active subscription')

  const newPriceId = PLANS[newPlan].priceId[interval]
  if (!newPriceId) return err('Invalid plan or interval')

  try {
    const subscription = await stripe.subscriptions.retrieve(billing.subscriptionId)
    const itemId = subscription.items.data[0]?.id
    if (!itemId) return err('Subscription item not found')

    await stripe.subscriptions.update(billing.subscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
    })

    return ok(true)
  } catch (e) {
    console.error('Failed to change subscription:', e)
    return err('Failed to change plan')
  }
}

export const switchToMonthlyAtRenewal = async (plan: Plan) => {
  const billing = await getBillingInfo()
  if (!billing?.subscriptionId) return err('No active subscription')

  const newPriceId = PLANS[plan].priceId['monthly']
  if (!newPriceId) return err('Invalid plan')

  try {
    const subscription = await stripe.subscriptions.retrieve(billing.subscriptionId)
    const itemId = subscription.items.data[0]?.id
    if (!itemId) return err('Subscription item not found')

    await stripe.subscriptions.update(billing.subscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'none',
      billing_cycle_anchor: 'unchanged',
    })

    return ok(true)
  } catch (e) {
    console.error('Failed to schedule interval switch:', e)
    return err('Failed to schedule switch')
  }
}
