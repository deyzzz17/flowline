'use server'

import { Pool } from 'pg'
import { sendEmail } from '@/lib/send-email'
import crypto from 'crypto'

export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const userResult = await pool.query(
      `SELECT u.id FROM "user" u
       INNER JOIN account a ON a."userId" = u.id
       WHERE u.email = $1 AND a."providerId" = 'credential'
       LIMIT 1`,
      [email],
    )
    
    if (userResult.rows.length === 0) return { ok: true }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    const identifier = `reset-password:${email}`

    await pool.query(`DELETE FROM verification WHERE identifier = $1`, [identifier])

    await pool.query(
      `INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [crypto.randomUUID(), identifier, token, expiresAt],
    )

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    await sendEmail({
      to: email,
      subject: 'Reset your Flowline password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 20px; font-weight: 700; color: #111;">Flowline</span>
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #111; margin: 0 0 8px;">
            Reset your password
          </h1>
          <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.5;">
            We received a request to reset the password for your Flowline account.
            Click the button below to choose a new password.
            This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}"
            style="display: inline-block; background: #7c3aed; color: #fff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px; text-decoration: none;">
            Reset password
          </a>
          <p style="font-size: 13px; color: #999; margin: 24px 0 0; line-height: 1.5;">
            If you didn't request a password reset, you can safely ignore this email.
            Your password will not be changed.<br/>
            This link will expire in 1 hour.
          </p>
        </div>
      `,
    })

    return { ok: true }
  } catch (e) {
    console.error('requestPasswordReset error:', e)
    return { ok: true } 
  } finally {
    await pool.end()
  }
}
