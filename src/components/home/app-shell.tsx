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
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c] shadow-2xl shadow-black/50 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
            <span className="text-[11px] font-bold text-white">M</span>
          </div>
          <span className="text-sm font-semibold text-white">Flowline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40">
            <Bell className="h-3.5 w-3.5" />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40">
            <Moon className="h-3.5 w-3.5" />
          </span>
          <span className="h-7 w-7 rounded-full bg-linear-to-br from-orange-400 to-amber-500" />
        </div>
      </div>

      <div className="flex">
        <div className="hidden w-36 shrink-0 flex-col border-r border-white/6 p-3 sm:flex">
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.key === active
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${
                    isActive ? 'bg-white/8 font-medium text-white' : 'text-white/35'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
              )
            })}
          </nav>
          <div className="mt-auto space-y-0.5 pt-4 text-[10px] text-white/20">
            <div className="flex items-center gap-2 px-2.5 py-1">
              <LifeBuoy className="h-3 w-3" />
              Support
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1">
              <MessageSquare className="h-3 w-3" />
              Feedback
            </div>
          </div>
        </div>

        <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-white/6 py-3 sm:hidden">
          {navItems.map((item) => {
            const isActive = item.key === active
            return (
              <div
                key={item.key}
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/25'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
              </div>
            )
          })}
        </div>

        <div className="min-w-0 flex-1 p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
