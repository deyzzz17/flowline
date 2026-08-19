import { ArrowRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Reveal } from '@/components/home/reveal'

export const FinalCtaSection = () => (
  <section className="mx-auto max-w-screen-2xl px-4 pb-24 sm:px-6 lg:px-10">
    <Reveal>
      <div
        className="relative overflow-hidden rounded-3xl border p-12 text-center md:p-20
        border-violet-200 bg-linear-to-br from-violet-50 via-purple-50/50 to-indigo-50
        dark:border-violet-500/20 dark:from-violet-600/20 dark:via-purple-600/10 dark:to-indigo-600/20"
      >
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-violet-100/60 via-transparent to-indigo-100/60 dark:from-violet-500/10 dark:via-transparent dark:to-indigo-500/10" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-400 blur-3xl opacity-20 dark:opacity-25" />

        <div className="relative z-10">
          <h2 className="mb-4 text-4xl font-bold text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
            Start organizing your life with Flowline.
          </h2>
          <p className="mx-auto mb-10 max-w-md text-base text-slate-500 dark:text-white/50">
            Tasks, habits and focus time — one workspace, free forever.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-violet-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:bg-violet-500 hover:-translate-y-0.5 hover:shadow-violet-500/40 hover:shadow-xl active:translate-y-0"
            >
              Start your flow — Free
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-8 py-3.5 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-400 dark:text-white/30">
            No credit card required · Setup in 30 seconds
          </p>
        </div>
      </div>
    </Reveal>
  </section>
)
