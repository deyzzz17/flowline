import { PlayIcon } from '@heroicons/react/24/outline'
import { SectionLabel } from '@/components/home/section-label'
import { Reveal } from '@/components/home/reveal'

export const DemoSection = () => {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <Reveal>
          <SectionLabel>See it in action</SectionLabel>
        </Reveal>
        <Reveal delay={50}>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            From task to focus, in seconds.
          </h2>
        </Reveal>
      </div>

      {/*
        TODO: swap this placeholder once the demo is ready.
        Suggested content: a silent 20-30s loop showing
        create a task -> add it to the calendar -> start a timer -> check off a habit.
        Replace the div below with, e.g.:
        <video className="w-full h-full object-cover" autoPlay loop muted playsInline src="/demo.mp4" />
      */}
      <Reveal delay={100}>
        <div className="mx-auto flex aspect-video max-w-4xl flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
            <PlayIcon className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-400 dark:text-white/30">
            Demo video coming soon
          </p>
        </div>
      </Reveal>
    </section>
  )
}
