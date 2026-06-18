import { Zap, LayoutGrid, BarChart3 } from 'lucide-react'
import { SectionLabel } from '@/components/home/section-label'
import { Reveal } from '@/components/home/reveal'

const steps = [
  {
    step: '01',
    icon: Zap,
    title: 'Create your workspace',
    body: "Sign up and you're in — no setup wizard, no template gallery to dig through first.",
  },
  {
    step: '02',
    icon: LayoutGrid,
    title: 'Add tasks & habits',
    body: 'Build your task lists and daily habits side by side. Flexible categories, zero configuration.',
  },
  {
    step: '03',
    icon: BarChart3,
    title: 'Track & improve',
    body: 'Watch your analytics update in real time. Spot patterns, celebrate streaks, keep going.',
  },
]

export const OnboardingSection = () => (
  <section className="mx-auto max-w-screen-2xl px-4 py-24 sm:px-6 lg:px-10">
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <Reveal>
        <SectionLabel>Up and running in minutes</SectionLabel>
      </Reveal>
      <Reveal delay={50}>
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Zero setup. Zero configuration.
        </h2>
      </Reveal>
      <Reveal delay={100}>
        <p className="text-base text-slate-500 dark:text-white/40">
          Tired of spending hours configuring Notion? Flowline works out of the box.
        </p>
      </Reveal>
    </div>

    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-slate-200 md:grid-cols-3 dark:bg-white/15">
      {steps.map((item) => (
        <Reveal key={item.step}>
          <div className="group relative h-full bg-white p-8 transition-colors duration-300 hover:bg-slate-50 dark:bg-[oklch(0.09_0.005_285)] dark:hover:bg-white/5">
            <span className="mb-4 block select-none text-5xl font-bold text-slate-200 dark:text-white/20">
              {item.step}
            </span>
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/25 dark:text-violet-300">
              <item.icon className="h-4.5 w-4.5" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
              {item.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-white/40">{item.body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
)
