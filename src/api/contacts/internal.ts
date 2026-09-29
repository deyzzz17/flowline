import 'server-only'
import { pool } from '@/lib/db-pool'

// Server-only helpers for other server code (webhooks, jobs, other actions).
// They take user/team ids as trusted input, so they must never be server
// actions: anything exported from a 'use server' file can be called from
// the browser with arbitrary arguments.

export async function findUserByEmail(email: string): Promise<ContactProfile | null> {
  const result = await pool.query(
    `SELECT id, name, email, image FROM "user" WHERE email = $1 LIMIT 1`,
    [email.trim().toLowerCase()],
  )
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return { id: row.id, name: row.name, email: row.email, image: row.image ?? null }
}

export async function findUsersByIds(ids: string[]): Promise<Map<string, ContactProfile>> {
  const map = new Map<string, ContactProfile>()
  if (ids.length === 0) return map
  const result = await pool.query(
    `SELECT id, name, email, image FROM "user" WHERE id = ANY($1::text[])`,
    [ids],
  )
  for (const row of result.rows) {
    map.set(row.id, { id: row.id, name: row.name, email: row.email, image: row.image ?? null })
  }
  return map
}

export interface ContactProfile {
  id: string
  name: string
  email: string
  image: string | null
}
