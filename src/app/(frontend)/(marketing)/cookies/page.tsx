import type { Metadata } from 'next'
import Link from 'next/link'
import { CookiePreferencesLink } from '@/components/marketing/cookie-preferences-link'

export const metadata: Metadata = {
  title: 'Cookie Policy — Flowline',
  description: 'Learn which cookies Flowline uses, why, and how to manage your preferences.',
}

const cookieTable = [
  {
    name: 'better-auth.session_token',
    purpose: 'Keeps you signed in to your account.',
    duration: '7 days',
    type: 'Strictly necessary',
  },
  {
    name: 'better-auth.session_data',
    purpose: 'Short-lived cache of your session, to avoid re-checking it on every request.',
    duration: '5 minutes',
    type: 'Strictly necessary',
  },
  {
    name: 'sidebar_state',
    purpose: 'Remembers whether the app sidebar is expanded or collapsed. Only set once you are signed in and using the app.',
    duration: '7 days',
    type: 'Strictly necessary',
  },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Last updated: August 26, 2026
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Cookie Policy
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            This page explains what cookies Flowline uses, why, and how you can manage your
            preferences at any time.
          </p>
        </div>

        <div className="space-y-12">
          <section className="scroll-mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border/40">
              1. What are cookies?
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cookies are small text files stored on your device when you visit a website. They can
              be used for many purposes, such as keeping you signed in, remembering your
              preferences, or tracking your activity across sites for advertising.
            </p>
          </section>

          <section className="scroll-mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border/40">
              2. What Flowline uses cookies for
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                Flowline only uses <strong className="text-foreground">strictly necessary</strong>{' '}
                cookies, the ones required to keep the application working and secure. We do not
                use any advertising, tracking, or third-party analytics cookies, and we do not sell
                or share your data with advertisers.
              </p>
              <p>
                Because these cookies are strictly necessary, they are exempt from consent under the
                ePrivacy Directive and GDPR — but we still let you choose your preference below,
                and we will always come back to ask for consent if we ever introduce optional
                cookies (for analytics or marketing, for example).
              </p>
            </div>
          </section>

          <section className="scroll-mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border/40">
              3. Cookies we use
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-border/60">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-4 py-3 font-semibold text-foreground">Name</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Purpose</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Duration</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieTable.map((row, i) => (
                    <tr
                      key={row.name}
                      className={i !== cookieTable.length - 1 ? 'border-b border-border/40' : ''}
                    >
                      <td className="px-4 py-3 align-top font-mono text-xs text-foreground">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">{row.purpose}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                        {row.duration}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                        {row.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="scroll-mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border/40">
              4. Managing your preferences
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                When you first visit Flowline, a banner lets you accept all cookies, decline them,
                or customize your choice. Since we only use strictly necessary cookies today, every
                choice results in the same experience, but we record it so we can honor it and ask
                again if that ever changes.
              </p>
              <p>
                You can review or change your choice at any time:{' '}
                <CookiePreferencesLink />.
              </p>
              <p>
                Most browsers also let you block or delete cookies directly in their settings.
                Doing so may prevent Flowline from keeping you signed in.
              </p>
            </div>
          </section>

          <section className="scroll-mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border/40">
              5. More information
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              For more details on how we handle your personal data, see our{' '}
              <Link
                href="/privacy"
                className="text-violet-600 dark:text-violet-400 underline underline-offset-2 font-medium"
              >
                Privacy Policy
              </Link>
              . For any question, contact us at{' '}
              <a
                href="mailto:support@flowlineworkspace.com"
                className="text-violet-600 dark:text-violet-400 underline underline-offset-2 font-medium"
              >
                support@flowlineworkspace.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Flowline. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
