'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { api } from '@/api'
import {
  LIVE_POLL_INTERVAL_MS,
  LIVE_POLL_INTERVAL_WITH_PUSH_MS,
  SLOW_POLL_INTERVAL_MS,
  REALTIME_EVENT,
  realtimeChannels,
  type RealtimeInvalidation,
} from '@/lib/realtime'

interface RealtimeContextValue {
  connected: boolean
  subscribe: (channel: string) => () => void
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  subscribe: () => () => {},
})

interface RealtimeToken {
  token: string
  expires: number
  clientId: string
}

// Ably's Server-Sent Events endpoint: the browser's native EventSource is
// all that's needed to receive messages — no Ably SDK in the client bundle
// (its prebuilt builds also don't survive Next's SWC pipeline).
const ABLY_SSE_URL = 'https://main.realtime.ably.net/sse'

/** How long Ably can resume a dropped stream without losing messages (2 min, with margin). */
const RESUME_WINDOW_MS = 100_000

async function fetchToken(): Promise<RealtimeToken | null> {
  const res = await fetch('/api/realtime/token', { cache: 'no-store' }).catch(() => null)
  if (!res || res.status !== 200) return null
  return res.json()
}

/**
 * Keeps one SSE connection to Ably per tab and turns incoming `invalidate`
 * hints into React Query invalidations. Always subscribed to the viewer's
 * own `user:<id>` channel and to the active workspace's channel; components
 * add more (e.g. an open shared list) via `useRealtimeChannel`. When Ably
 * isn't configured (the token route answers 204) or the stream is down,
 * nothing breaks — `useLivePollInterval()` just falls back to polling.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(false)
  const [connected, setConnected] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const refCounts = useRef(new Map<string, number>())
  const [extraChannels, setExtraChannels] = useState<string[]>([])
  const tokenRef = useRef<RealtimeToken | null>(null)
  const lastEventIdRef = useRef<string | null>(null)

  // Same cache the sidebar's workspace switcher fills — never fetches here.
  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.workspaces.list(),
    enabled: false,
  })
  const activeWorkspace = workspaces?.docs.find((w) => w.id === workspaces.activeId)
  const workspaceChannel =
    activeWorkspace?.id && !activeWorkspace.isPersonal
      ? realtimeChannels.workspace(activeWorkspace.id)
      : null

  // Probe once: is push configured at all, and who am I?
  useEffect(() => {
    let cancelled = false
    fetchToken().then((token) => {
      if (cancelled) return
      tokenRef.current = token
      setUserId(token?.clientId ?? null)
      setEnabled(!!token)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const subscribe = useCallback((channel: string) => {
    const counts = refCounts.current
    counts.set(channel, (counts.get(channel) ?? 0) + 1)
    setExtraChannels([...counts.keys()])
    return () => {
      const n = (counts.get(channel) ?? 1) - 1
      if (n <= 0) counts.delete(channel)
      else counts.set(channel, n)
      setExtraChannels([...counts.keys()])
    }
  }, [])

  const channels = [
    ...(userId ? [realtimeChannels.user(userId)] : []),
    ...(workspaceChannel ? [workspaceChannel] : []),
    ...extraChannels,
  ]
  const channelsKey = [...new Set(channels)].sort().join(',')

  // One EventSource for the current set of channels; reopened (resuming from
  // the last event id) when the set changes or the token nears expiry.
  useEffect(() => {
    if (!enabled || !channelsKey) return
    let disposed = false
    let source: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    let failures = 0
    // When the stream last went down (null while up). Ably keeps a
    // connection's state for 2 minutes and the browser resumes from the last
    // event id, so short drops lose nothing; only a longer outage warrants
    // refreshing what's on screen.
    let droppedAt: number | null = null

    const onMessage = (event: MessageEvent<string>) => {
      if (event.lastEventId) lastEventIdRef.current = event.lastEventId
      try {
        const message = JSON.parse(event.data) as { name?: string; data?: unknown }
        if (message.name !== REALTIME_EVENT) return
        const data = (
          typeof message.data === 'string' ? JSON.parse(message.data) : message.data
        ) as RealtimeInvalidation | undefined
        if (data?.actor && data.actor === userId) return
        for (const key of data?.keys ?? []) {
          queryClient.invalidateQueries({ queryKey: key as QueryKey })
        }
      } catch {}
    }

    const close = () => {
      clearTimeout(retryTimer)
      clearTimeout(refreshTimer)
      source?.close()
      source = null
    }

    const scheduleRetry = () => {
      close()
      failures++
      retryTimer = setTimeout(() => void open(), Math.min(60_000, 2_000 * 2 ** (failures - 1)))
    }

    const open = async (): Promise<void> => {
      let token = tokenRef.current
      if (!token || token.expires - Date.now() < 2 * 60_000) {
        token = await fetchToken()
        tokenRef.current = token
      }
      if (disposed) return
      if (!token) return scheduleRetry()

      const params = new URLSearchParams({
        channels: channelsKey,
        v: '1.2',
        accessToken: token.token,
      })
      if (lastEventIdRef.current) params.set('lastEvent', lastEventIdRef.current)
      const es = new EventSource(`${ABLY_SSE_URL}?${params}`)
      source = es
      es.onmessage = onMessage
      es.onopen = () => {
        failures = 0
        setConnected(true)
        // Anything published during a long outage (beyond what lastEvent
        // could resume) was missed — refresh what's on screen once.
        if (droppedAt !== null && Date.now() - droppedAt > RESUME_WINDOW_MS) {
          queryClient.invalidateQueries()
        }
        droppedAt = null
      }
      es.onerror = () => {
        setConnected(false)
        droppedAt ??= Date.now()
        // CONNECTING: the browser retries by itself. CLOSED: usually an
        // expired token or a channel outside its capabilities (a workspace
        // joined after it was issued) — start over with a fresh token.
        if (es.readyState === EventSource.CLOSED) {
          tokenRef.current = null
          scheduleRetry()
        }
      }
      // Reconnect with a fresh token shortly before this one expires.
      refreshTimer = setTimeout(
        () => {
          tokenRef.current = null
          close()
          void open()
        },
        Math.max(60_000, token.expires - Date.now() - 2 * 60_000),
      )
    }

    void open()
    return () => {
      disposed = true
      close()
      setConnected(false)
    }
  }, [enabled, channelsKey, queryClient, userId])

  return (
    <RealtimeContext.Provider value={{ connected, subscribe }}>{children}</RealtimeContext.Provider>
  )
}

/** Subscribes this tab to an extra channel (e.g. `list:<id>`) while mounted. */
export function useRealtimeChannel(channel: string | null | undefined) {
  const { subscribe } = useContext(RealtimeContext)
  useEffect(() => {
    if (!channel) return
    return subscribe(channel)
  }, [channel, subscribe])
}

export function useRealtimeConnected() {
  return useContext(RealtimeContext).connected
}

/**
 * The `refetchInterval` to use for data other people can change.
 * - `live`: shared tasks, comments, the notification bell — 30s without push, 1h safety net with push.
 * - `slow`: teams, roles, membership — 2 min without push, no polling with push.
 */
export function useLivePollInterval(kind: 'live' | 'slow' = 'live'): number | false {
  const connected = useRealtimeConnected()
  if (kind === 'slow') return connected ? false : SLOW_POLL_INTERVAL_MS
  return connected ? LIVE_POLL_INTERVAL_WITH_PUSH_MS : LIVE_POLL_INTERVAL_MS
}
