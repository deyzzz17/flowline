import { ClipboardList, CalendarDays, Flame, Timer } from 'lucide-react'
import { SectionLabel } from '@/components/home/section-label'
import { Reveal } from '@/components/home/reveal'
import { AppShell } from '@/components/home/app-shell'
import { TasksContent } from '@/components/home/task-content'
import { CalendarContent } from '@/components/home/calendar-content'
import { HabitsContent } from '@/components/home/habits-content'
import { TimerContent } from '@/components/home/timer-content'

const pillars = [
  {
    nav: 'lists' as const,
    icon: ClipboardList,
    name: 'Tasks',
    title: 'Organize projects and daily work.',
    color: 'text-violet-600 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-500/15',
    Content: TasksContent,
  },
  {
    nav: 'calendar' as const,
    icon: CalendarDays,
    name: 'Calendar',
    title: 'Plan your week and never miss important events.',
    color: 'text-blue-600 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-500/15',
    Content: CalendarContent,
  },
  {
    nav: 'habits' as const,
    icon: Flame,
    name: 'Habits',
    title: 'Build consistency with visual progress tracking.',
    color: 'text-orange-600 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-500/15',
    Content: HabitsContent,
  },
  {
    nav: 'timer' as const,
    icon: Timer,
    name: 'Focus Timer',
    title: 'Stay focused and reduce distractions.',
    color: 'text-pink-600 dark:text-pink-300',
    bg: 'bg-pink-50 dark:bg-pink-500/15',
    Content: TimerContent,
  },
]

export const PillarsSection = () => {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <Reveal>
          <SectionLabel>Inside Flowline</SectionLabel>
        </Reveal>
        <Reveal delay={50}>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            One workspace, four pillars.
          </h2>
        </Reveal>
      </div>

      <div className="space-y-20">
        {pillars.map((p, i) => {
          const reversed = i % 2 === 1
          return (
            <Reveal key={p.name}>
              <div
                className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                  reversed ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div>
                  <div
                    className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${p.bg} ${p.color}`}
                  >
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {p.name}
                  </h3>
                  <p className="max-w-sm text-base leading-relaxed text-slate-500 dark:text-white/50">
                    {p.title}
                  </p>
                </div>
                <AppShell active={p.nav}>
                  <p.Content />
                </AppShell>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
