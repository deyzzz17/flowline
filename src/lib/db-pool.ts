import 'server-only'
import { Pool } from 'pg'

// One Postgres connection pool for the whole process, reused across every
// ad-hoc query in this codebase (raw `pool.query` calls outside Payload/Better
// Auth, which already manage their own persistent pools). Opening a fresh
// `new Pool()` per call — the old pattern here — pays a full TCP+TLS
// handshake every single time; on serverless (Vercel) that handshake crosses
// the network to Neon on every request, which is the dominant cost behind
// "every page is slow". Cached on `global` exactly like Payload caches its
// own instance (see `global._payload` in payload's source), so this survives
// dev HMR reloads and is reused across warm Lambda invocations in prod.
declare global {
  var _pgPool: Pool | undefined
}

export const pool = global._pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL })

if (!global._pgPool) {
  global._pgPool = pool
}
