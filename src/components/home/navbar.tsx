import Link from 'next/link'
import { Logo } from '@/components/home/logo'

export const Navbar = () => (
  <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-md dark:border-white/8 dark:bg-[oklch(0.09_0.005_285)]/80">
    <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-10">
      <Logo />
      <div className="flex items-center gap-5">
        <Link
          href="/sign-in"
          className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline dark:text-white/60 dark:hover:text-white"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  </header>
)
