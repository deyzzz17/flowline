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

interface CookiePreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CookiePreferencesDialog({ open, onOpenChange }: CookiePreferencesDialogProps) {
  const { decide } = useCookieConsent()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="h-4 w-4 text-violet-500" />
            Customize cookies
          </DialogTitle>
          <DialogDescription>Choose which cookies Flowline is allowed to use.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Strictly necessary</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Keeps you signed in and keeps the app secure. Exempt from consent under GDPR /
                ePrivacy, so this can&apos;t be turned off while you use Flowline.
              </p>
            </div>
            <div
              aria-label="Always active"
              className="mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full bg-violet-600 px-0.5"
            >
              <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-white">
                <Lock className="h-2.5 w-2.5 text-violet-600" />
              </span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            That&apos;s the only category we use today — no analytics, marketing, or advertising
            cookies. If that ever changes, we&apos;ll list the new category here and ask for your
            consent before turning it on. See the{' '}
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
