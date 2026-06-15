'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, AlertCircle } from 'lucide-react'
import { FlowlineLogo } from '@/components/header/flowline-logo'

function detectInAppBrowser(): { isInApp: boolean; name: string } {
  if (typeof window === 'undefined') return { isInApp: false, name: '' }

  const ua = navigator.userAgent

  if (/LinkedIn/i.test(ua)) return { isInApp: true, name: 'LinkedIn' }
  if (/Instagram/i.test(ua)) return { isInApp: true, name: 'Instagram' }
  if (/FBAN|FBAV/i.test(ua)) return { isInApp: true, name: 'Facebook' }
  if (/Twitter/i.test(ua)) return { isInApp: true, name: 'Twitter' }
  if (/TikTok/i.test(ua)) return { isInApp: true, name: 'TikTok' }
  if (/Snapchat/i.test(ua)) return { isInApp: true, name: 'Snapchat' }
  if (/Pinterest/i.test(ua)) return { isInApp: true, name: 'Pinterest' }
  if (/wv\)/i.test(ua) || /GSA\//i.test(ua)) return { isInApp: true, name: 'une application' }

  return { isInApp: false, name: '' }
}

export function InAppBrowserGuard({ children }: { children: React.ReactNode }) {
  const [inApp, setInApp] = useState<{ isInApp: boolean; name: string } | null>(null)

  useEffect(() => {
    setInApp(detectInAppBrowser())
  }, [])

  if (inApp === null) return <>{children}</>

  if (!inApp.isInApp) return <>{children}</>

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

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
      <p className="mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed">
        You&apos;re viewing Flowline in {inApp.name}&apos;s browser. To sign in with Google, please
        open this page in Safari or Chrome.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Open in browser
        </a>

        <p className="text-xs text-muted-foreground">
          Tap the <strong>⋯</strong> or <strong>⋮</strong> menu in the top corner and choose
          &quot;Open in browser&quot;
        </p>
      </div>
    </div>
  )
}
