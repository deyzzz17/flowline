import 'server-only'
import { type Plan } from '@/lib/stripe'
import { pool } from '@/lib/db-pool'

// Server-only helpers for other server code (webhooks, jobs, other actions).
// They take user/team ids as trusted input, so they must never be server
// actions: anything exported from a 'use server' file can be called from
// the browser with arbitrary arguments.

export async function markTrialUsed(userId: string, plan: Plan) {
  const field = plan === 'plus' ? '"hadPlusTrial"' : '"hadProTrial"'
  await pool.query(`UPDATE "user" SET ${field} = TRUE WHERE id = $1`, [userId])
}
