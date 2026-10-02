import type { Metadata } from 'next'
import Link from 'next/link'
import { CookiePreferencesLink } from '@/components/marketing/cookie-preferences-link'
import { COOKIE_CATALOG, COOKIE_CATEGORIES, STORAGE_CATALOG } from '@/lib/cookie-catalog'

export const metadata: Metadata = {
  title: 'Cookie Policy — Flowline',
  description: 'Learn which cookies Flowline uses, why, and how to manage your preferences.',
}

const categoryLabels = Object.fromEntries(COOKIE_CATEGORIES.map((c) => [c.key, c.label]))

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Last updated: October 2, 2026
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
                cookies, the ones required to keep the application working and secure. We do not use
                any advertising, tracking, or third-party analytics cookies, and we do not sell or
                share your data with advertisers.
              </p>
              <p>
                Because these cookies are strictly necessary, they are exempt from consent under the
                ePrivacy Directive and GDPR — but we still let you choose your preference below, and
                we will always come back to ask for consent if we ever introduce optional cookies
                (for analytics or marketing, for example).
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
                  {COOKIE_CATALOG.map((row, i) => (
                    <tr
                      key={row.name}
                      className={i !== COOKIE_CATALOG.length - 1 ? 'border-b border-border/40' : ''}
                    >
                      <td className="px-4 py-3 align-top font-mono text-xs text-foreground">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">{row.purpose}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                        {row.duration}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                        {categoryLabels[row.category]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">
              On secure (HTTPS) connections, the sign-in cookies are prefixed with{' '}
              <code className="font-mono">__Secure-</code> (for example{' '}
              <code className="font-mono">__Secure-better-auth.session_token</code>). We use no
              third-party cookies: payments are handled on Stripe&apos;s own checkout page, under
              Stripe&apos;s cookie policy.
            </p>
          </section>

          <section className="scroll-mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border/40">
              4. Local storage and similar technologies
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Besides cookies, Flowline saves a few small items in your browser&apos;s local and
              session storage. They never leave your device on their own, are not used to track you,
              and only serve to make the app work smoothly or remember your preferences.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-border/60">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-4 py-3 font-semibold text-foreground">Name</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Purpose</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Storage</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {STORAGE_CATALOG.map((row, i) => (
                    <tr
                      key={row.name}
                      className={
                        i !== STORAGE_CATALOG.length - 1 ? 'border-b border-border/40' : ''
                      }
                    >
                      <td className="px-4 py-3 align-top font-mono text-xs break-words text-foreground">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">{row.purpose}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                        {row.storage}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                        {row.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="scroll-mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border/40">
              5. Managing your preferences
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                When you first visit Flowline, a banner lets you accept all cookies or only the
                essential ones. Since we only use strictly necessary cookies today, both choices
                result in the same experience, but we record yours so we can honor it and ask again
                if that ever changes.
              </p>
              <p>
                You can review or change your choice at any time: <CookiePreferencesLink />.
              </p>
              <p>
                Most browsers also let you block or delete cookies and site data (including local
                storage) directly in their settings. Doing so may prevent Flowline from keeping you
                signed in and will reset the preferences listed above.
              </p>
            </div>
          </section>

          <section className="scroll-mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border/40">
              6. More information
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
