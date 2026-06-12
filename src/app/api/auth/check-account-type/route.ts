import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(`check-account-type:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let email: string
  try {
    const body = await req.json()
    email = body.email
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

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
      const credResult = await pool.query(
        `SELECT u.id FROM "user" u
         INNER JOIN account a ON a."userId" = u.id
         WHERE u.email = $1 AND a."providerId" = 'credential'
         LIMIT 1`,
        [email],
      )
      if (credResult.rows.length === 0) {
        return NextResponse.json({ type: 'google' })
      }
    }

    return NextResponse.json({ type: 'password' })
  } finally {
    await pool.end()
  }
}
