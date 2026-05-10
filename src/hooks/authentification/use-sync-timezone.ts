'use client'

import { useSession } from '@/lib/auth-client'
import { authClient } from '@/lib/auth-client'
import { useRef } from 'react'

export function useSyncTimezone() {
  const { data: session } = useSession()
  const synced = useRef(false)

  if (session?.user && !synced.current) {
    synced.current = true

    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const storedTimezone = session.user.timezone as string | null | undefined

    if (detectedTimezone && detectedTimezone !== storedTimezone) {
      authClient.updateUser({ timezone: detectedTimezone } as never).catch(() => {
        synced.current = false
      })
    }
  }
}
