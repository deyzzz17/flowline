'use server'

import { Pool } from 'pg'

export async function checkAccountType(
  email: string,
): Promise<'google' | 'password' | 'not_found'> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const googleResult = await pool.query(
      `SELECT u.id FROM "user" u
       INNER JOIN account a ON a."userId" = u.id
       WHERE u.email = $1 AND a."providerId" = 'google'
       LIMIT 1`,
      [email],
    )

    if (googleResult.rows.length > 0) {
      const passwordResult = await pool.query(
        `SELECT u.id FROM "user" u
         INNER JOIN account a ON a."userId" = u.id
         WHERE u.email = $1 AND a."providerId" = 'credential'
         LIMIT 1`,
        [email],
      )
      if (passwordResult.rows.length === 0) return 'google'
    }

    const credResult = await pool.query(
      `SELECT u.id FROM "user" u
       INNER JOIN account a ON a."userId" = u.id
       WHERE u.email = $1 AND a."providerId" = 'credential'
       LIMIT 1`,
      [email],
    )

    if (credResult.rows.length > 0) return 'password'

    return 'not_found'
  } finally {
    await pool.end()
  }
}
