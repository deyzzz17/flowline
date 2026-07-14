'use server'

import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { stripe, PLANS, getPlanFromPriceId, type Plan, type BillingInterval } from '@/lib/stripe'
import { getSession } from '@/lib/get-session'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'
import { ok, err } from '@/types/result'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export const getBillingInfo = async () => {
  const userId = await getUserId()
  if (!userId) return null

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(
      `SELECT plan, "subscriptionStatus", "subscriptionId", "stripeCustomerId", "trialEndsAt"
       FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      plan: (row.plan ?? 'free') as Plan,
      subscriptionStatus: row.subscriptionStatus as string | null,
      subscriptionId: row.subscriptionId as string | null,
      stripeCustomerId: row.stripeCustomerId as string | null,
      trialEndsAt: row.trialEndsAt ? new Date(row.trialEndsAt) : null,
      isActive: row.subscriptionStatus === 'active' || row.subscriptionStatus === 'trialing',
      isTrial: row.subscriptionStatus === 'trialing',
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


export const createCheckoutSession = async (plan: Plan, interval: BillingInterval) => {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')

  const { id: userId, email, name } = session.user
  const planConfig = PLANS[plan]

  if (!planConfig.priceId[interval]) {
    return err('Invalid plan or interval')
  }

  const customerId = await getOrCreateStripeCustomer(userId, email, name ?? '')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: planConfig.priceId[interval]!,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: planConfig.trialDays ?? undefined,
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
  if (!billing?.stripeCustomerId) {
    return err('No Stripe customer found')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${appUrl}/billing`,
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
    console.error('Failed to change subscription plan:', e)
    return err('Failed to change plan')
  }
}
