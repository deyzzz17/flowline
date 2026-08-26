'use client'

import { useState } from 'react'
import { Cookie } from 'lucide-react'
import Link from 'next/link'
import { useCookieConsent } from '@/contexts/cookie-consent-context'
import { CookiePreferencesDialog } from './cookie-preferences-dialog'

export function CookieConsentBanner() {
  const { isBannerOpen, decide } = useCookieConsent()
  const [customizeOpen, setCustomizeOpen] = useState(false)

  if (!isBannerOpen) return null

  return (
    <>
      <div
        role="dialog"
        aria-live="polite"
        aria-label="Cookie preferences"
        className="fixed inset-x-4 bottom-4 z-100 sm:inset-x-auto sm:left-4 sm:max-w-sm animate-in fade-in slide-in-from-bottom-4"
      >
        <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
              <Cookie className="h-4.5 w-4.5 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">We use cookies</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                We use strictly necessary cookies to keep you signed in and keep Flowline secure —
                no advertising or analytics cookies.{' '}
                <Link
                  href="/cookies"
                  className="font-medium text-violet-600 hover:underline dark:text-violet-400"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => decide('rejected_all')}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground transition-all hover:bg-muted"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => setCustomizeOpen(true)}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground transition-all hover:bg-muted"
            >
              Customize
            </button>
            <button
              type="button"
              onClick={() => decide('accepted_all')}
              className="w-full rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-500"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>

      <CookiePreferencesDialog open={customizeOpen} onOpenChange={setCustomizeOpen} />
    </>
  )
}
