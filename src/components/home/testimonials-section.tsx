import { SectionLabel } from '@/components/home/section-label'
import { Reveal } from '@/components/home/reveal'

export const TestimonialsSection = () => (
  <section className="mx-auto max-w-screen-2xl px-4 py-24 sm:px-6 lg:px-10">
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <Reveal>
        <SectionLabel>What beta testers say</SectionLabel>
      </Reveal>
      <Reveal delay={50}>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Early feedback, real words.
        </h2>
      </Reveal>
    </div>

    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
      <Reveal>
        <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-white/60">
            &ldquo;I replaced Todoist and my habit tracker with one app. The time analytics were
            eye-opening.&rdquo;
          </p>
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-full bg-linear-to-br from-violet-400 to-purple-500" />
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-white/80">Alex</p>
              <p className="text-[11px] text-slate-400 dark:text-white/30">Freelance designer</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/*
        TODO: replace these two placeholder cards with real beta tester quotes before launch.
        Keeping them as obvious placeholders (dashed border, muted text) rather than inventing
        fake names/quotes — presenting fabricated reviews as genuine is misleading and, in many
        places, against consumer protection rules.
      */}
      {[0, 1].map((i) => (
        <Reveal key={i} delay={100 + i * 60}>
          <div className="flex h-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center dark:border-white/10 dark:bg-white/[0.015]">
            <p className="text-sm text-slate-400 dark:text-white/25">Your next testimonial here</p>
            <p className="text-[11px] text-slate-300 dark:text-white/15">— Name, role</p>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
)
