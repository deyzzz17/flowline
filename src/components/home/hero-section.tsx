'use client'

import { useMounted } from '@/hooks/home/use-mounted'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { AppShell } from '@/components/home/app-shell'
import { DashboardContent } from '@/components/home/dashboard-content'

export const HeroSection = () => {
  const mounted = useMounted()
  const base = 'transition-all duration-700 ease-out motion-reduce:transition-none'
  const hidden = 'opacity-0 translate-y-6'
  const shown = 'opacity-100 translate-y-0'

  return (
    <section className="mx-auto max-w-screen-2xl px-4 pt-16 pb-20 sm:px-6 lg:px-10 lg:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <div
          className={`mb-7 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 ${base} ${mounted ? shown : hidden}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />
          Everything flows. Nothing slips.
        </div>

        <h1
          className={`mb-5 text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl ${base} delay-100 ${mounted ? shown : hidden}`}
        >
          <span className="text-slate-900 dark:text-white">More than a to-do list. </span>
          <span className="bg-linear-to-r from-violet-600 via-purple-500 to-indigo-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400">
            A workspace built for flow.
          </span>
        </h1>

        <p
          className={`mx-auto mb-10 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl ${base} delay-150 dark:text-white/60 ${mounted ? shown : hidden}`}
        >
          Track your tasks, build lasting habits connected to your calendar, and log your focus time
          with integrated analytics. Simple, beautiful, and free forever.
        </p>

        <div
          className={`flex flex-col items-center gap-3 ${base} delay-300 ${mounted ? shown : hidden}`}
        >
          <Link
            href="/sign-up"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-violet-600 px-9 py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:bg-violet-500 hover:shadow-violet-500/40 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Start your flow — Free</span>
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
          <p className="text-xs text-slate-400 dark:text-white/30">
            No credit card required · Setup in 30 seconds
          </p>
        </div>
      </div>

      <div
        className={`relative mx-auto mt-16 max-w-6xl ${base} delay-300 ${mounted ? shown : hidden}`}
      >
        <div className="pointer-events-none absolute -inset-x-16 -top-12 h-40 rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-500/20" />
        <AppShell active="home">
          <DashboardContent />
        </AppShell>
      </div>
    </section>
  )
}
