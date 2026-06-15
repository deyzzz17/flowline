'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { FlowlineLogo } from '@/components/header/flowline-logo'

function detectInAppBrowser(): { isInApp: boolean; name: string; isAndroid: boolean } {
  if (typeof window === 'undefined') return { isInApp: false, name: '', isAndroid: false }

  const ua = navigator.userAgent
  const isAndroid = /Android/i.test(ua)

  if (/LinkedIn/i.test(ua)) return { isInApp: true, name: 'LinkedIn', isAndroid }
  if (/Instagram/i.test(ua)) return { isInApp: true, name: 'Instagram', isAndroid }
  if (/FBAN|FBAV/i.test(ua)) return { isInApp: true, name: 'Facebook', isAndroid }
  if (/Twitter/i.test(ua)) return { isInApp: true, name: 'Twitter', isAndroid }
  if (/TikTok/i.test(ua)) return { isInApp: true, name: 'TikTok', isAndroid }
  if (/Snapchat/i.test(ua)) return { isInApp: true, name: 'Snapchat', isAndroid }
  if (/Pinterest/i.test(ua)) return { isInApp: true, name: 'Pinterest', isAndroid }
  if (/wv\)/i.test(ua) || /GSA\//i.test(ua))
    return { isInApp: true, name: 'cette application', isAndroid }

  return { isInApp: false, name: '', isAndroid: false }
}

export function InAppBrowserGuard({ children }: { children: React.ReactNode }) {
  const [inApp, setInApp] = useState<{ isInApp: boolean; name: string; isAndroid: boolean } | null>(
    null,
  )
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    setInApp(detectInAppBrowser())
    setCurrentUrl(window.location.href)
  }, [])

  if (inApp === null) return <>{children}</>
  if (!inApp.isInApp) return <>{children}</>

  const chromeIntentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex items-center gap-3">
        <FlowlineLogo />
        <span className="text-xl font-bold text-foreground" translate="no">
          Flowline
        </span>
      </div>

      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
        <AlertCircle className="h-7 w-7 text-amber-500" />
      </div>

      <h1 className="mb-2 text-xl font-semibold text-foreground">Open in your browser</h1>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">
        You&apos;re viewing Flowline inside {inApp.name}. Google sign-in requires a real browser.
      </p>

      {inApp.isAndroid ? (
        <div className="w-full max-w-xs space-y-3">
          <a
            href={chromeIntentUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
          >
            Open in Chrome
          </a>
          <p className="text-xs text-muted-foreground">
            If Chrome doesn&apos;t open, tap <strong>⋮</strong> and choose &quot;Open in
            browser&quot;
          </p>
        </div>
      ) : (
        <div className="w-full max-w-xs space-y-4">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-left space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              How to open in Safari
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-600">
                  1
                </span>
                <p className="text-xs text-muted-foreground">
                  Tap <strong>⋯</strong> or <strong>⋮</strong> in the top corner
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-600">
                  2
                </span>
                <p className="text-xs text-muted-foreground">
                  Choose <strong>&quot;Open in browser&quot;</strong> or{' '}
                  <strong>&quot;Open in Safari&quot;</strong>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-600">
                  3
                </span>
                <p className="text-xs text-muted-foreground">Sign in with Google in Safari</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Or copy the link and paste it in Safari or Chrome
          </p>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard?.writeText(currentUrl).then(() => alert('Link copied!'))
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-background px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  )
}
