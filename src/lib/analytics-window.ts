import type { Plan } from '@/lib/stripe'

/**
 * Earliest date a plan is allowed to query analytics from, or null if unlimited.
 * free: last 7 days — plus: last 6 months — pro: unlimited.
 */
export function getAnalyticsWindowStart(plan: Plan): Date | null {
  if (plan === 'pro') return null

  const now = new Date()
  if (plan === 'plus') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 6)
    return d
  }

  const d = new Date(now)
  d.setDate(d.getDate() - 6)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Clamps [from, to] to the plan's analytics window.
 * Returns the (possibly narrower) fetch range to query, and whether the
 * requested range was restricted by the plan (partially or fully out of window).
 */
export function clampToAnalyticsWindow(
  from: Date,
  windowStart: Date | null,
): { fetchFrom: Date; restrictedByPlan: boolean } {
  if (!windowStart || from >= windowStart) return { fetchFrom: from, restrictedByPlan: false }
  return { fetchFrom: windowStart, restrictedByPlan: true }
}
