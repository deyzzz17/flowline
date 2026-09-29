// No 'server-only' here: payload.config.ts imports this (through the
// collection hooks), and the Payload CLI loads that config in plain Node.
import * as Ably from 'ably'
import { after } from 'next/server'
import { REALTIME_EVENT, type RealtimeInvalidation } from './realtime'

declare global {
  var _ablyRest: Ably.Rest | undefined
}

export function isRealtimeConfigured(): boolean {
  return !!process.env.ABLY_API_KEY
}

export function getAblyRest(): Ably.Rest | null {
  const key = process.env.ABLY_API_KEY
  if (!key) return null
  if (!global._ablyRest) global._ablyRest = new Ably.Rest({ key })
  return global._ablyRest
}

/** The signed-in user behind the current request, or null outside one (scripts, jobs). */
export async function getRealtimeActor(): Promise<string | null> {
  try {
    // Lazy: keeps Better Auth out of the Payload CLI's import graph.
    const { getSession } = await import('./get-session')
    const session = await getSession()
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

/**
 * Tells every client subscribed to `channels` that the given React Query key
 * prefixes are stale. The message carries no data at all — clients refetch
 * through the normal, permission-checked server actions — so a subscriber
 * can never learn anything it couldn't already read.
 *
 * Fire-and-forget: runs after the response is sent (`after()`), and a
 * failure only means clients fall back to their polling interval. A no-op
 * when Ably isn't configured.
 */
export function publishInvalidation(
  channels: (string | null | undefined | false)[],
  keys: RealtimeInvalidation['keys'],
  actor: string | null = null,
): void {
  const rest = getAblyRest()
  const targets = [...new Set(channels.filter((c): c is string => !!c))]
  if (!rest || targets.length === 0 || keys.length === 0) return

  const payload: RealtimeInvalidation = { keys, actor }
  const send = async () => {
    await Promise.all(
      targets.map((name) => rest.channels.get(name).publish(REALTIME_EVENT, payload)),
    ).catch((e) => console.error('[realtime] publish failed', e))
  }

  try {
    after(send)
  } catch {
    // Outside a Next.js request scope (scripts, Inngest functions).
    void send()
  }
}
