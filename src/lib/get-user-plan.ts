import 'server-only'
import { Pool } from 'pg'
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

export async function getUserPlanLimits(): Promise<{
  plan: Plan
  limits: PlanLimits
  userId: string | null
}> {
  const session = await getSession()
  const userId = session?.user?.id ?? null
  if (!userId) {
    return { plan: 'free', limits: getLimits('free'), userId: null }
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(
      `SELECT plan, "subscriptionStatus" FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    )
    const row = result.rows[0]
    const plan = await resolvePlanFromRow(row ?? {})
    return { plan, limits: getLimits(plan), userId }
  } finally {
    await pool.end()
  }
}

export async function getPlanLimitsForUserId(
  userId: string,
): Promise<{ plan: Plan; limits: PlanLimits }> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(
      `SELECT plan, "subscriptionStatus" FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    )
    const row = result.rows[0]
    const plan = await resolvePlanFromRow(row ?? {})
    return { plan, limits: getLimits(plan) }
  } finally {
    await pool.end()
  }
}
