'use client'

import { Cookie } from 'lucide-react'
import Link from 'next/link'
import { useCookieConsent } from '@/contexts/cookie-consent-context'
import { CookiePreferencesDialog } from './cookie-preferences-dialog'

export function CookieConsentBanner() {
  const { view, decide, openCustomize, backToBanner } = useCookieConsent()

  if (view === 'closed') return null

  return (
    <>
      {/* Hidden (not just visually covered) while Customize is open — the
          banner's z-100 sits above the dialog's z-50, so on mobile, where
          the taller itemized dialog can extend down into the banner's
          fixed bottom-4 area, the banner would otherwise intercept clicks
          on "Save preferences" before they ever reach the dialog. */}
      {view === 'banner' && (
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
                  We use strictly necessary cookies to keep you signed in and keep Flowline secure
                  — no advertising or analytics cookies.{' '}
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
                onClick={openCustomize}
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
      )}

      <CookiePreferencesDialog
        open={view === 'customize'}
        onOpenChange={(next) => {
          // Only fires for a user-initiated dismiss (Esc, outside click, the
          // X button) — Save calls `decide()` directly, which drives `view`
          // to 'closed' on its own, so this never fights that transition.
          if (!next) backToBanner()
        }}
      />
    </>
  )
}
