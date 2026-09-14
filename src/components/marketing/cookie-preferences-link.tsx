'use client'

import { useCookieConsent } from '@/contexts/cookie-consent-context'
import { cn } from '@/lib/utils'

interface CookiePreferencesLinkProps {
  className?: string
  children?: React.ReactNode
}

export function CookiePreferencesLink({ className, children }: CookiePreferencesLinkProps) {
  const { openPreferences } = useCookieConsent()

  return (
    <button
      type="button"
      onClick={openPreferences}
      className={cn('font-medium text-violet-600 hover:underline dark:text-violet-400', className)}
    >
      {children ?? 'Manage your cookie preferences'}
    </button>
  )
}
