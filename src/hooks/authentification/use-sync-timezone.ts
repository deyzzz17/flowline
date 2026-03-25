'use client'

import { useSession } from '@/lib/auth-client'
import { authClient } from '@/lib/auth-client'
import { useRef } from 'react'

export function useSyncTimezone() {
  const { data: session } = useSession()
  const synced = useRef(false)

  if (session?.user && !synced.current) {
    const pendingTimezone = localStorage.getItem('pending_timezone')
    if (pendingTimezone) {
      synced.current = true
      authClient
        .updateUser({ timezone: pendingTimezone } as never)
        .then(() => localStorage.removeItem('pending_timezone'))
    }
  }
}
