import { AppWindow } from '@/components/home/app-window'
import { MiniTask } from '@/components/home/mini-task'
import { HabitBar } from '@/components/home/habit-bar'
import { MiniCalendar } from '@/components/home/mini-calendar'
import { TimerRing } from '@/components/home/timer-ring'

export const DashboardPreview = () => {
  return (
    <AppWindow label="Flowline — Dashboard" className="mx-auto">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/6 dark:bg-white/5 sm:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-white/70">Today</span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
              2 left
            </span>
          </div>
          <div className="space-y-2">
            <MiniTask done label="Review Q3 analytics report" />
            <MiniTask label="Prepare sprint planning notes" />
            <MiniTask label="Send weekly update email" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/6 dark:bg-white/5">
          <span className="mb-3 block text-xs font-semibold text-slate-600 dark:text-white/70">
            This week
          </span>
          <MiniCalendar />
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/6 dark:bg-white/5">
          <span className="mb-3 block text-xs font-semibold text-slate-600 dark:text-white/70">
            Habits
          </span>
          <div className="space-y-3">
            <HabitBar
              label="Meditate 🧘"
              pct={94}
              color="bg-gradient-to-r from-emerald-500 to-teal-500"
            />
            <HabitBar
              label="Read 30 min 📚"
              pct={72}
              color="bg-gradient-to-r from-violet-500 to-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/6 dark:bg-white/5 sm:col-span-2">
          <div>
            <span className="block text-xs font-semibold text-slate-600 dark:text-white/70">
              Focus timer
            </span>
            <span className="text-[11px] text-slate-400 dark:text-white/30">
              Deep work — Design
            </span>
          </div>
          <TimerRing progress={0.38} size={64} stroke={5} label="15:32" gradientId="hero-timer" />
        </div>
      </div>
    </AppWindow>
  )
}
