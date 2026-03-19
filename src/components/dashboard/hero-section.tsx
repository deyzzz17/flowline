'use client'

import { useMounted } from '@/hooks/dashboard/use-mounted'
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export const HeroSection = () => {
  const mounted = useMounted()

  return (
    <section className="mx-auto flex min-h-[95vh] max-w-screen-2xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-10">
      <div
        className={`mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur-sm transition-all duration-700
    border-violet-200 bg-violet-50 text-violet-600
    dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300
    ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <SparklesIcon className="h-3.5 w-3.5" />
        Introducing Flowline — Your productivity OS
      </div>

      <h1
        className={`mb-6 max-w-5xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <span className="text-slate-900 dark:text-white">Everything flows. </span>
        <span className="relative inline-block">
          <span className="bg-linear-to-r from-violet-600 via-purple-500 to-indigo-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400">
            Nothing slips.
          </span>
          <span className="absolute -bottom-1 left-0 h-px w-full bg-linear-to-r from-violet-400/0 via-violet-500/60 to-violet-400/0" />
        </span>
      </h1>

      <p
        className={`mb-10 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl transition-all duration-700 delay-200 dark:text-white/50 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        Tasks, habits, timers, analytics, and shared workspaces — all in one beautifully connected
        workspace designed to help you and your team reach peak performance.
      </p>

      <div
        className={`flex flex-col gap-4 sm:flex-row transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <Link
          href="/sign-up"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:bg-violet-500 hover:shadow-violet-500/40 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Sign up</span>
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </Link>
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:-translate-y-0.5 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:shadow-none dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-white">
          Demo
        </button>
      </div>
    </section>
  )
}
