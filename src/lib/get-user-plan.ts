import 'server-only'
import { cache } from 'react'
import { pool } from '@/lib/db-pool'
import { getSession } from '@/lib/get-session'
import { getLimits } from '@/lib/plan-limits'
import type { Plan } from '@/lib/stripe'
import type { PlanLimits } from '@/lib/plan-limits'

async function resolvePlanFromRow(row: {
  plan?: string | null
  subscriptionStatus?: string | null
}): Promise<Plan> {
  const subscriptionStatus = row?.subscriptionStatus
  const isActive =
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'trialing' ||
    subscriptionStatus === null
  const rawPlan = (row?.plan ?? 'free') as Plan
  return isActive || rawPlan === 'free' ? rawPlan : 'free'
}

// Wrapped in React's `cache()` — called from dozens of places (every
// limit/compliance check, every analytics widget) and frequently several
// times within the same page render for the same user. Deduping here means
// one query per render instead of one per call site.
export const getUserPlanLimits = cache(
  async (): Promise<{
    plan: Plan
    limits: PlanLimits
    userId: string | null
  }> => {
    const session = await getSession()
    const userId = session?.user?.id ?? null
    if (!userId) {
      return { plan: 'free', limits: getLimits('free'), userId: null }
    }
    const result = await pool.query(
      `SELECT plan, "subscriptionStatus" FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    )
    const row = result.rows[0]
    const plan = await resolvePlanFromRow(row ?? {})
    return { plan, limits: getLimits(plan), userId }
  },
)

export const getPlanLimitsForUserId = cache(
  async (userId: string): Promise<{ plan: Plan; limits: PlanLimits }> => {
    const result = await pool.query(
      `SELECT plan, "subscriptionStatus" FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    )
    const row = result.rows[0]
    const plan = await resolvePlanFromRow(row ?? {})
    return { plan, limits: getLimits(plan) }
  },
)
