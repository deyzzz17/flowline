'use client'

import { useCookieConsent } from '@/contexts/cookie-consent-context'

export function CookiePreferencesLink() {
  const { openPreferences } = useCookieConsent()

  return (
    <button
      type="button"
      onClick={openPreferences}
      className="font-medium text-violet-600 hover:underline dark:text-violet-400"
    >
      Manage your cookie preferences
    </button>
  )
}
