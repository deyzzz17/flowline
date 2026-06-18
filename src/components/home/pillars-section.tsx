import { CheckCheck, CalendarDays, Flame, Timer } from 'lucide-react'
import { SectionLabel } from '@/components/home/section-label'
import { Reveal } from '@/components/home/reveal'
import { AppWindow } from '@/components/home/app-window'
import { MiniTask } from '@/components/home/mini-task'
import { MiniCalendar } from '@/components/home/mini-calendar'
import { HabitBar } from '@/components/home/habit-bar'
import { TimerRing } from '@/components/home/timer-ring'

const TasksMockup = () => (
  <AppWindow label="Lists — Flowline">
    <div className="space-y-2">
      <MiniTask done label="Set up workspaces" />
      <MiniTask label="Set up shared lists" />
      <MiniTask label="Integrate Stripe" />
      <MiniTask label="Prepare sprint planning" />
    </div>
  </AppWindow>
)

const CalendarMockup = () => (
  <AppWindow label="Calendar — June 2026">
    <MiniCalendar />
  </AppWindow>
)

const HabitsMockup = () => (
  <AppWindow label="Habits — Daily">
    <div className="space-y-4">
      <HabitBar
        label="Morning workout 🏋️"
        pct={86}
        color="bg-gradient-to-r from-orange-500 to-red-500"
      />
      <HabitBar
        label="Meditate 🧘"
        pct={94}
        color="bg-gradient-to-r from-emerald-500 to-teal-500"
      />
      <HabitBar
        label="Cold shower 🚿"
        pct={60}
        color="bg-gradient-to-r from-blue-500 to-cyan-500"
      />
    </div>
    <div className="mt-4 flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 dark:border-orange-500/20 dark:bg-orange-500/10">
      <Flame className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
      <span className="text-xs font-medium text-orange-600 dark:text-orange-300">
        32-day streak — keep it up!
      </span>
    </div>
  </AppWindow>
)

const TimerMockup = () => (
  <AppWindow label="Focus session">
    <div className="flex flex-col items-center justify-center gap-3 py-2">
      <TimerRing progress={0.38} size={88} stroke={6} label="15:32" gradientId="pillar-timer" />
      <span className="text-xs text-slate-400 dark:text-white/40">Deep work — Design</span>
    </div>
  </AppWindow>
)

const pillars = [
  {
    icon: CheckCheck,
    name: 'Tasks',
    title: 'Organize projects and daily work.',
    color: 'text-violet-600 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-500/15',
    Mockup: TasksMockup,
  },
  {
    icon: CalendarDays,
    name: 'Calendar',
    title: 'Plan your week and never miss important events.',
    color: 'text-blue-600 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-500/15',
    Mockup: CalendarMockup,
  },
  {
    icon: Flame,
    name: 'Habits',
    title: 'Build consistency with visual progress tracking.',
    color: 'text-orange-600 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-500/15',
    Mockup: HabitsMockup,
  },
  {
    icon: Timer,
    name: 'Focus Timer',
    title: 'Stay focused and reduce distractions.',
    color: 'text-pink-600 dark:text-pink-300',
    bg: 'bg-pink-50 dark:bg-pink-500/15',
    Mockup: TimerMockup,
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
                <p.Mockup />
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
