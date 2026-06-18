import { SparklesIcon, CalendarIcon, BoltIcon, UsersIcon } from '@heroicons/react/24/outline'
import { SectionLabel } from '@/components/home/section-label'
import { Reveal } from '@/components/home/reveal'

const upcoming = [
  { icon: SparklesIcon, name: 'AI Assistant', desc: 'Get suggestions on what to tackle next.' },
  { icon: CalendarIcon, name: 'Smart Planning', desc: 'Let Flowline arrange your week for you.' },
  {
    icon: BoltIcon,
    name: 'Workflow Automation',
    desc: 'Connect tasks, habits and events automatically.',
  },
  { icon: UsersIcon, name: 'Team Collaboration', desc: 'Share workspaces and plan together.' },
]

export const RoadmapSection = () => {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <Reveal>
          <SectionLabel>Roadmap</SectionLabel>
        </Reveal>
        <Reveal delay={50}>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            What&apos;s coming next
          </h2>
        </Reveal>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
        {upcoming.map((item, i) => (
          <Reveal key={item.name} delay={100 + i * 60}>
            <div className="relative rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.02]">
              <span className="absolute right-5 top-5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:bg-white/5 dark:text-white/30">
                In development
              </span>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-500 dark:bg-violet-500/10 dark:text-violet-300/70">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-slate-700 dark:text-white/70">
                {item.name}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400 dark:text-white/35">
                {item.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
