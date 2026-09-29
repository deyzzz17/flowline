// Live updates for collaborative data (shared lists, workspaces, the
// notification bell) come from a push channel (Ably) when it's configured:
// every mutation publishes a tiny, content-free "these query keys changed"
// hint, and each connected client just invalidates those keys — so nothing
// touches the database while nothing changes. Vercel functions can't hold
// WebSockets themselves, which is why the socket lives on Ably's side.
//
// Polling remains only as a safety net. It used to be a flat 3s everywhere,
// which kept the Neon compute permanently awake (it only scales to zero
// after 5 idle minutes) and re-downloaded the same payloads ~20x/minute per
// open tab — the direct cause of blowing through the free-plan quotas.
// React Query already pauses these intervals while a tab is backgrounded and
// refetches on refocus.

/** Data other people can change and that should feel live (shared list tasks, comments, the bell). */
export const LIVE_POLL_INTERVAL_MS = 30_000
/** Same data, when push is connected — polling is then only a fallback for a missed message. */
export const LIVE_POLL_INTERVAL_WITH_PUSH_MS = 5 * 60_000
/** Data that rarely changes (teams, roles, membership) — without push. With push: no polling at all. */
export const SLOW_POLL_INTERVAL_MS = 2 * 60_000

export const realtimeChannels = {
  user: (userId: string) => `user:${userId}`,
  workspace: (workspaceId: string) => `workspace:${workspaceId}`,
  list: (listId: number | string) => `list:${listId}`,
}

/** Name of the only event published on every channel. */
export const REALTIME_EVENT = 'invalidate'

/** Payload of an `invalidate` event: React Query key prefixes to invalidate. */
export interface RealtimeInvalidation {
  keys: readonly (readonly unknown[])[]
  /**
   * userId whose action caused this, when known. That user's own tabs skip
   * the message — the mutation that caused it already invalidated those
   * keys locally, so reacting would only refetch the same data twice.
   */
  actor?: string | null
}
