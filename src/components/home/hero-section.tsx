'use client'

import { useMounted } from '@/hooks/home/use-mounted'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { DashboardPreview } from '@/components/home/dashboard-preview'

export const HeroSection = () => {
  const mounted = useMounted()
  const base = 'transition-all duration-700 ease-out motion-reduce:transition-none'
  const hidden = 'opacity-0 translate-y-6'
  const shown = 'opacity-100 translate-y-0'

  return (
    <section className="mx-auto max-w-screen-2xl px-4 pt-28 pb-20 sm:px-6 lg:px-10 lg:pt-36">
      <div className="mx-auto max-w-3xl text-center">
        <div
          className={`mb-7 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-mono text-[11px] uppercase tracking-widest backdrop-blur-sm border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/40 ${base} ${mounted ? shown : hidden}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />
          Introducing Flowline
        </div>

        <h1
          className={`mb-5 text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl ${base} delay-100 ${mounted ? shown : hidden}`}
        >
          <span className="text-slate-900 dark:text-white">Everything flows. </span>
          <span className="bg-linear-to-r from-violet-600 via-purple-500 to-indigo-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400">
            Nothing slips.
          </span>
        </h1>

        <p
          className={`mx-auto mb-4 max-w-xl text-lg font-medium leading-snug text-slate-700 sm:text-xl ${base} delay-150 dark:text-white/70 ${mounted ? shown : hidden}`}
        >
          You shouldn&apos;t have to manage your tasks, calendar, and habits across five different
          tools.
        </p>

        <p
          className={`mx-auto mb-10 max-w-lg text-base leading-relaxed text-slate-500 ${base} delay-200 dark:text-white/40 ${mounted ? shown : hidden}`}
        >
          Tasks, calendar, habits and focus sessions — combined in one simple workspace.
        </p>

        <div className={`flex justify-center ${base} delay-300 ${mounted ? shown : hidden}`}>
          <Link
            href="/sign-up"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:bg-violet-500 hover:shadow-violet-500/40 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Get Started Free</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
        </div>
      </div>

      <div className={`mx-auto mt-16 max-w-5xl ${base} delay-300 ${mounted ? shown : hidden}`}>
        <DashboardPreview />
      </div>
    </section>
  )
}
