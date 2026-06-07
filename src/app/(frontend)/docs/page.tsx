import Link from 'next/link'
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  CalendarDays,
  Timer,
  BarChart2,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { DocPageHeader, DocSection, P, Callout } from '@/components/docs/docs-components'

const SECTIONS = [
  {
    icon: Zap,
    title: 'Getting started',
    description: 'Create your account and set up your first lists, habits, and calendar.',
    href: '/docs/getting-started',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Understand your day at a glance — progress, insights, and priorities.',
    href: '/docs/dashboard',
  },
  {
    icon: CheckSquare,
    title: 'Tasks & Lists',
    description:
      'Create tasks, manage subtasks, set due dates, and organise everything into lists.',
    href: '/docs/tasks',
  },
  {
    icon: Flame,
    title: 'Habits',
    description: 'Build lasting routines with streaks, completion tracking, and goals.',
    href: '/docs/habits',
  },
  {
    icon: CalendarDays,
    title: 'Calendar',
    description: 'Schedule events, connect Google Calendar, and see habits alongside your agenda.',
    href: '/docs/calendar',
  },
  {
    icon: Timer,
    title: 'Focus Timer',
    description: 'Deep work sessions with Pomodoro-style phases, categories, and session history.',
    href: '/docs/timer',
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    description: 'Track your productivity trends across tasks, habits, and focus time.',
    href: '/docs/analytics',
  },
]

export default function DocsPage() {
  return (
    <>
      <DocPageHeader
        badge="Documentation"
        title="Welcome to Flowline"
        description="Flowline is your all-in-one productivity OS, combining tasks, habits, calendar, and deep work into a single coherent workspace. This documentation covers everything you need to get the most out of it."
      />

      <DocSection id="what-is-flowline" title="What is Flowline?">
        <P>
          Flowline brings together the four pillars of personal productivity in one place: task
          management, habit tracking, time-blocking, and focused work sessions. Instead of juggling
          multiple apps, everything connects, habits appear on your calendar, focus sessions link to
          tasks, and your dashboard gives you a real-time read on how your day is going.
        </P>
        <P>
          The core philosophy is that productivity isn&apos;t about checking boxes, it&apos;s about
          building systems. Flowline is designed to make those systems visible, measurable, and
          frictionless.
        </P>
        <Callout type="tip" title="New here?">
          Start with the Getting started guide to create your first list and habit, then explore
          each feature section as you need it.
        </Callout>
      </DocSection>

      <DocSection id="browse" title="Browse the documentation">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-4 transition-all hover:border-violet-500/30 hover:bg-violet-500/5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                <s.icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-violet-500 transition-colors shrink-0" />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </DocSection>
    </>
  )
}
