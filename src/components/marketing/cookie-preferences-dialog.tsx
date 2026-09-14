'use client'

import { Cookie, Lock } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useCookieConsent } from '@/contexts/cookie-consent-context'
import { COOKIE_CATEGORIES, cookiesByCategory } from '@/lib/cookie-catalog'

interface CookiePreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CookiePreferencesDialog({ open, onOpenChange }: CookiePreferencesDialogProps) {
  const { decide } = useCookieConsent()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="h-4 w-4 shrink-0 text-violet-500" />
            Customize cookies
          </DialogTitle>
          <DialogDescription>
            Every cookie Flowline sets, listed individually — none of them can be turned off
            without breaking sign-in, but you can see exactly what each one does.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {COOKIE_CATEGORIES.map((category) => {
            const cookies = cookiesByCategory(category.key)
            if (cookies.length === 0) return null

            return (
              <div key={category.key} className="space-y-2.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">{category.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                </div>

                <div className="space-y-2">
                  {cookies.map((cookie) => (
                    <div
                      key={cookie.name}
                      className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="break-all font-mono text-xs font-medium text-foreground">
                          {cookie.name}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {cookie.purpose}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          Expires: {cookie.duration}
                        </p>
                      </div>
                      {category.locked ? (
                        <div
                          role="img"
                          aria-label="Always active, cannot be turned off"
                          title="Always active — cannot be turned off"
                          className="flex h-5 w-9 shrink-0 items-center self-start rounded-full bg-violet-600 px-0.5 sm:self-auto"
                        >
                          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-white">
                            <Lock className="h-2.5 w-2.5 text-violet-600" />
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <p className="text-xs leading-relaxed text-muted-foreground">
            That&apos;s every cookie we use today — no analytics, marketing, or advertising
            cookies. If that ever changes, we&apos;ll list the new cookies here individually and
            ask for your consent before turning any of them on. See the{' '}
            <Link
              href="/cookies"
              className="font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              Cookie Policy
            </Link>{' '}
            for details.
          </p>
        </div>

        <DialogFooter className="pt-2">
          <button
            type="button"
            onClick={() => {
              decide('essential_only')
              onOpenChange(false)
            }}
            className="w-full rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-500"
          >
            Save preferences
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
