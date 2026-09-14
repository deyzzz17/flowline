'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  getStoredCookieConsent,
  storeCookieConsent,
  type CookieConsentStatus,
} from '@/lib/cookie-consent'

// A single state machine instead of two independent booleans (one for the
// banner, one for the dialog) — 'closed' is the only state where nothing
// renders, so there's exactly one flag to check anywhere, and no way for
// the banner and the dialog to disagree about whether saving should close
// both of them.
export type CookieConsentView = 'closed' | 'banner' | 'customize'

interface CookieConsentContextType {
  status: CookieConsentStatus | null
  view: CookieConsentView
  decide: (status: CookieConsentStatus) => void
  openCustomize: () => void
  backToBanner: () => void
  openPreferences: () => void
}

const CookieConsentContext = createContext<CookieConsentContextType | null>(null)

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CookieConsentStatus | null>(null)
  const [view, setView] = useState<CookieConsentView>('closed')

  useEffect(() => {
    const stored = getStoredCookieConsent()
    setStatus(stored?.status ?? null)
    setView(stored ? 'closed' : 'banner')
  }, [])

  const decide = (next: CookieConsentStatus) => {
    storeCookieConsent(next)
    setStatus(next)
    setView('closed')
  }

  const openCustomize = () => setView('customize')
  const backToBanner = () => setView('banner')
  const openPreferences = () => setView('banner')

  return (
    <CookieConsentContext.Provider
      value={{ status, view, decide, openCustomize, backToBanner, openPreferences }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  return ctx
}
