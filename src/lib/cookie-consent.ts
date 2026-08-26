export type CookieConsentStatus = 'accepted_all' | 'essential_only' | 'rejected_all'

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
    if (
      parsed &&
      (parsed.status === 'accepted_all' ||
        parsed.status === 'essential_only' ||
        parsed.status === 'rejected_all')
    ) {
      return parsed as CookieConsentRecord
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
