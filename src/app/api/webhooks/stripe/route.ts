import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import { markTrialUsed } from '@/api/billing/actions'
import { reconcilePlanArchivedEntities } from '@/lib/plan-reconcile'
import { Pool } from 'pg'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function updateUserBilling(
  userId: string,
  data: {
    plan?: string
    subscriptionStatus?: string | null
    subscriptionId?: string | null
    trialEndsAt?: Date | null
  },
) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const sets: string[] = []
    const values: (string | Date | null)[] = []
    let idx = 1

    if (data.plan !== undefined) {
      sets.push(`"plan" = $${idx++}`)
      values.push(data.plan)
    }
    if (data.subscriptionStatus !== undefined) {
      sets.push(`"subscriptionStatus" = $${idx++}`)
      values.push(data.subscriptionStatus)
    }
    if (data.subscriptionId !== undefined) {
      sets.push(`"subscriptionId" = $${idx++}`)
      values.push(data.subscriptionId)
    }
    if (data.trialEndsAt !== undefined) {
      sets.push(`"trialEndsAt" = $${idx++}`)
      values.push(data.trialEndsAt)
    }

    if (sets.length === 0) return
    values.push(userId)
    await pool.query(`UPDATE "user" SET ${sets.join(', ')} WHERE id = $${idx}`, values)
  } finally {
    await pool.end()
  }
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return (customer as Stripe.Customer).metadata?.userId ?? null
}

const INACTIVE_STATUSES = new Set([
  'canceled',
  'incomplete_expired',
  'unpaid',
  'incomplete',
  'paused',
])

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        const plan = session.metadata?.plan as string | undefined
        if (!userId) break

        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const resolvedPlan = priceId ? getPlanFromPriceId(priceId) : ((plan as any) ?? 'free')

        if (subscription.trial_end && (resolvedPlan === 'plus' || resolvedPlan === 'pro')) {
          await markTrialUsed(userId, resolvedPlan)
        }

        await updateUserBilling(userId, {
          plan: resolvedPlan,
          subscriptionStatus: subscription.status,
          subscriptionId,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        })
        
        await reconcilePlanArchivedEntities(userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const userId = await getUserIdFromCustomer(customerId)
        if (!userId) break

        if (INACTIVE_STATUSES.has(subscription.status)) {
          await updateUserBilling(userId, {
            plan: 'free',
            subscriptionStatus: subscription.status,
            subscriptionId: null,
            trialEndsAt: null,
          })
          break
        }

        const priceId = subscription.items.data[0]?.price.id
        const plan = priceId ? getPlanFromPriceId(priceId) : 'free'

        await updateUserBilling(userId, {
          plan,
          subscriptionStatus: subscription.status,
          subscriptionId: subscription.id,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        })

        await reconcilePlanArchivedEntities(userId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const userId = await getUserIdFromCustomer(customerId)
        if (!userId) break

        await updateUserBilling(userId, {
          plan: 'free',
          subscriptionStatus: 'canceled',
          subscriptionId: null,
          trialEndsAt: null,
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const userId = await getUserIdFromCustomer(customerId)
        if (!userId) break

        await updateUserBilling(userId, { subscriptionStatus: 'past_due' })
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
