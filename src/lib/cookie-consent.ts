// Only two choices: Flowline sets strictly necessary cookies only (see
// cookie-catalog.ts), so there's nothing to customize or decline — the
// choice is recorded so we can ask again if optional cookies are ever added.
export type CookieConsentStatus = 'accepted_all' | 'essential_only'

export interface CookieConsentRecord {
  status: CookieConsentStatus
  decidedAt: string
}

const STORAGE_KEY = 'flowline_cookie_consent'

export function getStoredCookieConsent(): CookieConsentRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.status === 'accepted_all' || parsed?.status === 'essential_only') {
      return parsed as CookieConsentRecord
    }
    // Recorded by the former "Decline" button — same meaning as essential only.
    if (parsed?.status === 'rejected_all') {
      return { status: 'essential_only', decidedAt: parsed.decidedAt }
    }
    return null
  } catch {
    return null
  }
}

export function storeCookieConsent(status: CookieConsentStatus): CookieConsentRecord {
  const record: CookieConsentRecord = { status, decidedAt: new Date().toISOString() }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    } catch {}
  }
  return record
}
