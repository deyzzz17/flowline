'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  getStoredCookieConsent,
  storeCookieConsent,
  type CookieConsentStatus,
} from '@/lib/cookie-consent'

interface CookieConsentContextType {
  status: CookieConsentStatus | null
  isBannerOpen: boolean
  decide: (status: CookieConsentStatus) => void
  openPreferences: () => void
}

const CookieConsentContext = createContext<CookieConsentContextType | null>(null)

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CookieConsentStatus | null>(null)
  const [isBannerOpen, setIsBannerOpen] = useState(false)

  useEffect(() => {
    const stored = getStoredCookieConsent()
    setStatus(stored?.status ?? null)
    setIsBannerOpen(!stored)
  }, [])

  const decide = (next: CookieConsentStatus) => {
    storeCookieConsent(next)
    setStatus(next)
    setIsBannerOpen(false)
  }

  const openPreferences = () => setIsBannerOpen(true)

  return (
    <CookieConsentContext.Provider value={{ status, isBannerOpen, decide, openPreferences }}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  return ctx
}
