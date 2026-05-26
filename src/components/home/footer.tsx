import Link from 'next/link'

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

          <nav className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-xs text-slate-400 transition-colors hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}