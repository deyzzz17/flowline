import {
  Home,
  ClipboardList,
  Flame,
  CalendarDays,
  Timer,
  Bell,
  Moon,
  LifeBuoy,
  MessageSquare,
} from 'lucide-react'
import { FlowlineLogo } from '../header/flowline-logo'

const navItems = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'lists', label: 'Lists', icon: ClipboardList },
  { key: 'habits', label: 'Habits', icon: Flame },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'timer', label: 'Timer', icon: Timer },
] as const

type NavKey = (typeof navItems)[number]['key']

export const AppShell = ({
  active,
  children,
  className = '',
}: {
  active: NavKey
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-300 bg-[oklch(0.955_0.006_285)] shadow-2xl shadow-slate-900/5 dark:border-white/10 dark:bg-[oklch(0.22_0.012_265)] dark:shadow-black/50 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-white/6">
        <div className="flex items-center gap-2.5">
          <FlowlineLogo />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Flowline</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white/40">
            <Bell className="h-3.5 w-3.5" />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white/40">
            <Moon className="h-3.5 w-3.5" />
          </span>
          <span className="h-7 w-7 rounded-full bg-linear-to-br from-orange-400 to-amber-500" />
        </div>
      </div>

      <div className="flex">
        <div className="hidden w-44 shrink-0 flex-col border-r border-slate-100 p-3.5 dark:border-white/6 sm:flex">
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.key === active
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs ${
                    isActive
                      ? 'bg-slate-100 font-medium text-slate-900 dark:bg-white/8 dark:text-white'
                      : 'text-slate-400 dark:text-white/35'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
              )
            })}
          </nav>
          <div className="mt-auto space-y-0.5 pt-4 text-[11px] text-slate-300 dark:text-white/20">
            <div className="flex items-center gap-2 px-3 py-1">
              <LifeBuoy className="h-3 w-3" />
              Support
            </div>
            <div className="flex items-center gap-2 px-3 py-1">
              <MessageSquare className="h-3 w-3" />
              Feedback
            </div>
          </div>
        </div>

        <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-slate-100 py-3.5 dark:border-white/6 sm:hidden">
          {navItems.map((item) => {
            const isActive = item.key === active
            return (
              <div
                key={item.key}
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'
                    : 'text-slate-300 dark:text-white/25'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
              </div>
            )
          })}
        </div>

        <div className="min-w-0 flex-1 p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}
