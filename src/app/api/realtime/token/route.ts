import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db-pool'
import { getAblyRest } from '@/lib/realtime-server'
import { realtimeChannels } from '@/lib/realtime'
import { cached, cacheTags } from '@/lib/server-cache'

// Requested on every page load (and hourly per open tab) — cached, and
// invalidated by Better Auth's membership hooks (see auth.ts).
const getMemberWorkspaceIds = cached(
  async (userId: string): Promise<string[]> => {
    const { rows } = await pool.query<{ organizationId: string }>(
      `SELECT "organizationId" FROM member WHERE "userId" = $1`,
      [userId],
    )
    return rows.map((r) => r.organizationId)
  },
  'realtime-member-workspaces',
  { tags: (userId) => [cacheTags.userWorkspaces(userId)], revalidate: 3600 },
)

export const dynamic = 'force-dynamic'

/**
 * Ably token auth for the browser. The client never sees the API key; it
 * gets a short-lived (1h) token that may only *subscribe* to:
 * - its own `user:<id>` channel,
 * - the `workspace:<id>` channel of each workspace it belongs to,
 * - `list:*` — list channels only ever carry content-free invalidation hints
 *   (see publishInvalidation), and every refetch they trigger goes through
 *   the normal permission-checked server actions.
 *
 * 204 when Ably isn't configured: the client then stays on polling.
 */
export async function GET() {
  const rest = getAblyRest()
  if (!rest) return new NextResponse(null, { status: 204 })

  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceIds = await getMemberWorkspaceIds(userId)

  const capability: Record<string, ['subscribe']> = {
    [realtimeChannels.user(userId)]: ['subscribe'],
    [realtimeChannels.list('*')]: ['subscribe'],
  }
  for (const id of workspaceIds) capability[realtimeChannels.workspace(id)] = ['subscribe']

  // A ready-to-use token (not a token request): the browser connects to
  // Ably's SSE endpoint with it directly, without any Ably SDK.
  const token = await rest.auth.requestToken({
    clientId: userId,
    capability: JSON.stringify(capability),
    ttl: 60 * 60 * 1000,
  })

  return NextResponse.json(
    { token: token.token, expires: token.expires, clientId: userId },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
