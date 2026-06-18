import { SectionLabel } from '@/components/home/section-label'
import { Reveal } from '@/components/home/reveal'

const fragments = [
  { tool: 'Google Calendar', use: 'for your calendar' },
  { tool: 'Todoist', use: 'for your tasks' },
  { tool: 'Loop Habit Tracker', use: 'for your habits' },
  { tool: 'Your phone', use: 'for a focus timer' },
]

export const ProblemSection = () => {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <SectionLabel>The problem</SectionLabel>
        </Reveal>
        <Reveal delay={50}>
          <h2 className="mb-12 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Too many productivity apps.
          </h2>
        </Reveal>
      </div>

      <div className="mx-auto mb-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
        {fragments.map((f, i) => (
          <Reveal key={f.tool} delay={100 + i * 60}>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div>
                <p className="text-sm font-semibold text-slate-500 line-through decoration-slate-300 dark:text-white/40 dark:decoration-white/20">
                  {f.tool}
                </p>
                <p className="text-xs text-slate-400 dark:text-white/25">{f.use}</p>
              </div>
              <span className="text-lg text-slate-300 dark:text-white/15">✕</span>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={350}>
        <p className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Flowline brings everything together.
        </p>
      </Reveal>
    </section>
  )
}
