'use server'

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

export async function doResetPassword(
  email: string,
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: 'expired' | 'invalid' | 'unknown' }> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const identifier = `reset-password:${email}`

    const tokenResult = await pool.query(
      `SELECT value, "expiresAt" FROM verification
       WHERE identifier = $1 AND value = $2
       LIMIT 1`,
      [identifier, token],
    )

    if (tokenResult.rows.length === 0) {
      return { ok: false, error: 'invalid' }
    }

    const { expiresAt } = tokenResult.rows[0]
    if (new Date(expiresAt) < new Date()) {
      await pool.query(`DELETE FROM verification WHERE identifier = $1`, [identifier])
      return { ok: false, error: 'expired' }
    }

    const userResult = await pool.query(`SELECT id FROM "user" WHERE email = $1 LIMIT 1`, [email])

    if (userResult.rows.length === 0) {
      return { ok: false, error: 'invalid' }
    }

    const userId = userResult.rows[0].id

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await pool.query(
      `UPDATE account
       SET password = $1
       WHERE "userId" = $2 AND "providerId" = 'credential'`,
      [hashedPassword, userId],
    )

    await pool.query(`DELETE FROM verification WHERE identifier = $1`, [identifier])

    return { ok: true }
  } catch (e) {
    console.error('doResetPassword error:', e)
    return { ok: false, error: 'unknown' }
  } finally {
    await pool.end()
  }
}
