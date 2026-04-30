import {
  ArrowRightIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { CheckCheck, Flame, LayoutGrid, Timer, TrendingUp, Zap } from 'lucide-react'
import { HeroSection } from '@/components/home/hero-section'
import { Orb } from '@/components/home/orb'
import { SparkLine } from '@/components/home/spark-line'
import { FeatureCard } from '@/components/home/feature-card'
import { BentoCard } from '@/components/home/bento-card'
import { MiniTask } from '@/components/home/mini-task'
import { HabitBar } from '@/components/home/habit-bar'
import Link from 'next/link'
import { requireGuest } from '@/lib/require-auth'

export default async function HomePage() {
  await requireGuest()

  const focusData = [3.2, 5.1, 4.0, 6.4, 5.6, 7.2, 4.4]
  const focusLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const features = [
    {
      icon: CheckCheck,
      title: 'Smart Task Management',
      description:
        'Organize tasks with categories, priorities, and deadlines. Rich editing, subtasks, and soft-delete for a clutter-free workspace.',
      gradientDark: 'from-violet-500/20 to-purple-600/10',
      iconLight: 'bg-violet-50 text-violet-600',
      iconDarkBg: 'bg-violet-500/25',
      iconDarkColor: 'text-violet-300',
      delay: 0,
    },
    {
      icon: Flame,
      title: 'Habit Tracking',
      description:
        'Build lasting routines with streak tracking, custom frequencies, and visual progress rings that celebrate consistency.',
      gradientDark: 'from-orange-500/20 to-red-600/10',
      iconLight: 'bg-orange-50 text-orange-500',
      iconDarkBg: 'bg-orange-500/25',
      iconDarkColor: 'text-orange-300',
      delay: 50,
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description:
        'Deep insights into your productivity patterns. Visualize trends, identify peak hours, and optimize your workflow over time.',
      gradientDark: 'from-emerald-500/20 to-teal-600/10',
      iconLight: 'bg-emerald-50 text-emerald-600',
      iconDarkBg: 'bg-emerald-500/25',
      iconDarkColor: 'text-emerald-300',
      delay: 100,
    },
    {
      icon: CalendarDaysIcon,
      title: 'Unified Calendar',
      description:
        'One view for tasks, habits, and shared events. Personal and team schedules merge seamlessly with smart conflict detection.',
      gradientDark: 'from-blue-500/20 to-cyan-600/10',
      iconLight: 'bg-blue-50 text-blue-600',
      iconDarkBg: 'bg-blue-500/25',
      iconDarkColor: 'text-blue-300',
      delay: 150,
    },
    {
      icon: Timer,
      title: 'Focus Timers',
      description:
        'Category-based work timers with Pomodoro support. Track exactly where your time goes and find your productive flow.',
      gradientDark: 'from-pink-500/20 to-rose-600/10',
      iconLight: 'bg-pink-50 text-pink-600',
      iconDarkBg: 'bg-pink-500/25',
      iconDarkColor: 'text-pink-300',
      delay: 200,
    },
    {
      icon: UserGroupIcon,
      title: 'Shared Workspaces',
      description:
        'Invite your team, share schedules, and co-manage projects. Real-time collaboration with granular permission control.',
      gradientDark: 'from-amber-500/20 to-yellow-600/10',
      iconLight: 'bg-amber-50 text-amber-600',
      iconDarkBg: 'bg-amber-500/25',
      iconDarkColor: 'text-amber-300',
      delay: 250,
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-slate-900 selection:bg-violet-200  dark:text-white dark:selection:bg-violet-500/30">
      <div
        className="pointer-events-none fixed inset-0 z-0 dark:hidden"
        style={{
          backgroundImage: `linear-gradient(to right,rgba(109,40,217,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(109,40,217,0.04) 1px,transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />

      <Orb className="h-150 w-150 bg-violet-400 -top-48 -left-48" />
      <Orb className="h-100 w-100 bg-purple-400 top-1/3 -right-32" />
      <Orb className="h-125 w-125 bg-indigo-400 bottom-0 left-1/3" />

      <div className="relative z-10">
        <HeroSection />

        <section className="mx-auto max-w-screen-2xl px-4 pb-24 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <BentoCard className="lg:col-span-2 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-white/80">
                    My Tasks — Today
                  </span>
                </div>
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
                  3 left
                </span>
              </div>
              <div className="space-y-2">
                <MiniTask done label="Review Q3 analytics report" />
                <MiniTask done label="Update team workspace permissions" />
                <MiniTask label="Prepare sprint planning notes" />
                <MiniTask label="Review pull requests" />
                <MiniTask label="Send weekly update email" />
              </div>
              <div className="mt-4 h-px bg-slate-100 dark:bg-white/10" />
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 dark:text-white/30">
                <CheckCircleIcon className="h-3.5 w-3.5" />2 of 5 tasks completed today
              </div>
            </BentoCard>

            <BentoCard className="p-6">
              <div className="mb-5 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-white/80">
                  Habit Streaks
                </span>
              </div>
              <div className="space-y-4">
                <HabitBar
                  label="Morning workout 🏋️"
                  pct={86}
                  color="bg-gradient-to-r from-orange-500 to-red-500"
                />
                <HabitBar
                  label="Read 30 min 📚"
                  pct={72}
                  color="bg-gradient-to-r from-violet-500 to-purple-500"
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
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 dark:border-orange-500/20 dark:bg-orange-500/10">
                <Flame className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-300">
                  32-day streak — keep it up!
                </span>
              </div>
            </BentoCard>

            <BentoCard className="p-6">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-white/80">
                    Weekly Focus
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ↑ 18%
                </span>
              </div>
              <p className="mb-3 text-xs text-slate-400 dark:text-white/30">
                Hours of deep work this week
              </p>
              <SparkLine
                data={focusData}
                strokeLight="#7c3aed"
                strokeDark="#a78bfa"
                fillLight="#7c3aed"
                fillDark="#a78bfa"
              />
              <div className="mt-1 flex justify-between px-1">
                {focusLabels.map((l, i) => (
                  <span key={i} className="text-[10px] text-slate-400 dark:text-white/30">
                    {l}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Peak', value: '7.2h' },
                  { label: 'Avg', value: '5.1h' },
                  { label: 'Total', value: '35.9h' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                    <div className="text-sm font-semibold text-slate-700 dark:text-white/80">
                      {s.value}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-white/30">{s.label}</div>
                  </div>
                ))}
              </div>
            </BentoCard>

            <BentoCard className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Timer className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-white/80">
                  Focus Timer
                </span>
              </div>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-slate-100 dark:text-white/10"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      fill="none"
                      stroke="url(#pink-grad)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * 0.38}`}
                    />
                    <defs>
                      <linearGradient id="pink-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-xl font-bold tabular-nums text-slate-800 dark:text-white">
                    15:32
                  </span>
                </div>
                <span className="mt-2 text-xs text-slate-400 dark:text-white/40">
                  Deep work — Design
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Today', value: '4h 12m' },
                  { label: 'Week', value: '23h' },
                  { label: 'Sessions', value: '14' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                    <div className="text-sm font-semibold text-slate-700 dark:text-white/80">
                      {s.value}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-white/30">{s.label}</div>
                  </div>
                ))}
              </div>
            </BentoCard>

            <BentoCard className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-white/80">
                  Team Workspace
                </span>
              </div>
              <div className="space-y-3">
                {[
                  {
                    name: 'Sprint Review',
                    time: '10:00',
                    members: ['A', 'B', 'C'],
                    color: 'bg-blue-500',
                  },
                  {
                    name: 'Gym session 🏋️',
                    time: '12:30',
                    members: ['A', 'D'],
                    color: 'bg-orange-500',
                  },
                  {
                    name: 'Design sync',
                    time: '15:00',
                    members: ['B', 'C', 'E'],
                    color: 'bg-violet-500',
                  },
                ].map((ev) => (
                  <div
                    key={ev.name}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-slate-200 dark:border-white/6 dark:bg-white/5 dark:hover:border-white/15"
                  >
                    <div className={`h-2 w-2 rounded-full shrink-0 ${ev.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 truncate dark:text-white/80">
                        {ev.name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-white/30">{ev.time}</div>
                    </div>
                    <div className="flex -space-x-1.5">
                      {ev.members.map((m) => (
                        <div
                          key={m}
                          className="h-5 w-5 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-white dark:ring-black/20"
                        >
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>
        </section>

        <section className="mx-auto max-w-screen-2xl px-4 pb-24 sm:px-6 lg:px-10">
          <div className="mb-14 text-center">
            <p className="mb-4 text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Everything you need
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Built for the way you work
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500 dark:text-white/40">
              Every feature is designed to work together seamlessly, from your daily solo habits to
              complex team-wide projects.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-screen-2xl px-4 pb-24 sm:px-6 lg:px-10">
          <div className="mb-14 text-center">
            <p className="mb-4 text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Simple by design
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Up and running in minutes
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-slate-200 md:grid-cols-3 dark:bg-white/15">
            {[
              {
                step: '01',
                icon: Zap,
                title: 'Create your workspace',
                body: 'Sign up, name your workspace, and invite your team. Solo or collaborative — Flowline adapts to your setup.',
              },
              {
                step: '02',
                icon: LayoutGrid,
                title: 'Add tasks & habits',
                body: 'Build your task lists, define your daily habits, and set recurring goals. Flexible categories keep everything organized.',
              },
              {
                step: '03',
                icon: ChartBarIcon,
                title: 'Track & improve',
                body: 'Watch your analytics update in real time. Spot patterns, celebrate streaks, and continuously level up your productivity.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative bg-white p-8 transition-colors duration-300 hover:bg-slate-50 dark:bg-[oklch(0.09_0.005_285)] dark:hover:bg-white/5"
              >
                <span className="mb-4 block select-none text-5xl font-bold text-slate-200 transition-colors group-hover:text-slate-200 dark:text-white/20 dark:group-hover:text-white/8">
                  {item.step}
                </span>
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/25 dark:text-violet-300">
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-white/40">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-screen-2xl px-4 pb-24 sm:px-6 lg:px-10">
          <div
            className="relative overflow-hidden rounded-3xl border p-12 text-center md:p-20
            border-violet-200 bg-linear-to-br from-violet-50 via-purple-50/50 to-indigo-50
            dark:border-violet-500/20 dark:from-violet-600/20 dark:via-purple-600/10 dark:to-indigo-600/20"
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-violet-100/60 via-transparent to-indigo-100/60 dark:from-violet-500/10 dark:via-transparent dark:to-indigo-500/10" />
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-400 blur-3xl opacity-20 dark:opacity-25" />

            <div className="relative z-10">
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium
                border-violet-200 bg-white/80 text-violet-600
                dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300"
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                Free forever plan available
              </div>
              <h2 className="mb-4 text-4xl font-bold text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
                Ready to find your flow?
              </h2>
              <p className="mx-auto mb-10 max-w-lg text-lg text-slate-500 dark:text-white/50">
                Join thousands of individuals and teams who have transformed how they work with
                Flowline.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/sign-up"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-violet-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:bg-violet-500 hover:-translate-y-0.5 hover:shadow-violet-500/40 hover:shadow-xl active:translate-y-0
                  dark:bg-white dark:text-violet-900 dark:shadow-white/10 dark:hover:shadow-white/20"
                >
                  Sign up
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
              </div>
              <p className="mt-6 text-xs text-slate-400 dark:text-white/25">
                No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
