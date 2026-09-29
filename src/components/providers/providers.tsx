'use client'

import { useSyncTimezone } from '@/hooks/authentification/use-sync-timezone'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useMemo, useState } from 'react'
import { RealtimeProvider } from './realtime-provider'

// The React Query cache is kept in localStorage (one entry per user), so a
// reload or reopening the app paints instantly from it and only refetches
// what's actually stale, instead of re-downloading everything from the DB.
// Bump CACHE_VERSION whenever a cached query's data shape changes.
const CACHE_VERSION = '1'
const CACHE_KEY_PREFIX = 'flowline-query-cache:'
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

/** Removes every persisted query cache — call on sign-out. */
export function clearPersistedQueryCache() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(CACHE_KEY_PREFIX)) localStorage.removeItem(key)
    }
  } catch {}
}

// localStorage can throw (private mode, blocked site data, quota) — never
// let that break the app; persistence just silently stops.
const safeStorage =
  typeof window === 'undefined'
    ? undefined
    : {
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key)
          } catch {
            return null
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value)
          } catch {}
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key)
          } catch {}
        },
      }

// Server actions can return real Date objects; plain JSON would hand them
// back as strings. `this[key]` is the raw value (before Date#toJSON runs).
const DATE_TAG = '__date__'
function serialize(data: unknown): string {
  return JSON.stringify(data, function (this: Record<string, unknown>, key, value) {
    const raw = this[key]
    return raw instanceof Date ? { [DATE_TAG]: raw.toISOString() } : value
  })
}
function deserialize(text: string) {
  return JSON.parse(text, (_key, value) =>
    value && typeof value === 'object' && typeof value[DATE_TAG] === 'string'
      ? new Date(value[DATE_TAG])
      : value,
  )
}

export function Providers({
  children,
  cacheScope,
}: {
  children: React.ReactNode
  /** The signed-in user's id — each account gets its own persisted cache. */
  cacheScope?: string | null
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Mutations already invalidate what they touch, and changes made
            // by other people are pushed (see realtime-provider) — so data
            // younger than 5 min is served from the cache, with no DB trip,
            // on remount, navigation or refocus.
            staleTime: 5 * 60 * 1000,
            // Must be at least the persisted maxAge, or restored entries
            // would be garbage-collected right away.
            gcTime: CACHE_MAX_AGE_MS,
          },
        },
      }),
  )

  const persister = useMemo(
    () =>
      createSyncStoragePersister({
        // No user (signed out) → nothing is persisted.
        storage: cacheScope ? safeStorage : undefined,
        key: `${CACHE_KEY_PREFIX}${cacheScope ?? 'anonymous'}`,
        serialize,
        deserialize,
        throttleTime: 2000,
      }),
    [cacheScope],
  )

  useSyncTimezone()

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE_MS,
        buster: CACHE_VERSION,
        dehydrateOptions: {
          // Only settled, successful data — and never one-off lookups.
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' &&
            !String(query.queryKey[1] ?? '').includes('search') &&
            !String(query.queryKey[0]).includes('search'),
        },
      }}
    >
      <RealtimeProvider>{children}</RealtimeProvider>
    </PersistQueryClientProvider>
  )
}
