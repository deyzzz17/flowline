import Link from 'next/link'
import { CookiePreferencesLink } from '@/components/marketing/cookie-preferences-link'

const FOOTER_LINK_CLASSES =
  'text-xs text-slate-400 transition-colors hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-200/60 dark:border-white/8">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-white/70">
              Flowline
            </span>
            <span className="text-slate-300 dark:text-white/20">·</span>
            <span className="text-xs text-slate-400 dark:text-white/30">
              © {new Date().getFullYear()}
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/pricing" className={FOOTER_LINK_CLASSES}>
              Pricing
            </Link>
            <Link href="/privacy" className={FOOTER_LINK_CLASSES}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={FOOTER_LINK_CLASSES}>
              Terms
            </Link>
            <Link href="/cookies" className={FOOTER_LINK_CLASSES}>
              Cookies
            </Link>
            <CookiePreferencesLink className={FOOTER_LINK_CLASSES}>
              Cookie preferences
            </CookiePreferencesLink>
          </nav>
        </div>
      </div>
    </footer>
  )
}
