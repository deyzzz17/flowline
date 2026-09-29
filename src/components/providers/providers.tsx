'use client'

import { useSyncTimezone } from '@/hooks/authentification/use-sync-timezone'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { RealtimeProvider } from './realtime-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Mutations already invalidate what they touch, and live data is
          // pushed (see realtime-provider) — so a remount or a refocus
          // within a minute doesn't need another round trip to the DB.
          queries: { staleTime: 60 * 1000 },
        },
      }),
  )

  useSyncTimezone()

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>{children}</RealtimeProvider>
    </QueryClientProvider>
  )
}
