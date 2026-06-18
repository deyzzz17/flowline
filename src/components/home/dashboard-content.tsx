import { CheckCircle2, CalendarClock, Flame, Timer as TimerIcon, Sparkles } from 'lucide-react'
import { TimerRing } from '@/components/home/timer-ring'

const InsightRow = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-2.5">
    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />
    <p className="text-xs leading-relaxed text-slate-500 dark:text-white/50">{children}</p>
  </div>
)

export const DashboardContent = () => (
  <div>
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          Dashboard
        </p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Good morning, Sophie</h3>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <span className="h-8 w-8 rounded-full bg-linear-to-br from-orange-400 to-amber-500" />
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
          Edit profile
        </span>
      </div>
    </div>

    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/8 dark:bg-white/[0.02]">
        <p className="mb-3 text-xs font-medium text-slate-500 dark:text-white/50">
          Today at a glance
        </p>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-white/80">
                3 tasks remaining
              </p>
              <p className="text-[10px] text-slate-400 dark:text-white/30">None completed yet</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
              <CalendarClock className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-white/80">1 event today</p>
              <p className="text-[10px] text-slate-400 dark:text-white/30">
                Next: Dormir at 9:00 PM
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Flame className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-white/80">
                0/1 habits done
              </p>
              <p className="text-[10px] text-slate-400 dark:text-white/30">1 remaining</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
              <TimerIcon className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-white/80">
                No focus session yet
              </p>
              <p className="text-[10px] text-slate-400 dark:text-white/30">
                Start the timer to track focus
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/8 dark:bg-white/[0.02] sm:flex">
        <p className="mb-2.5 text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Day progress
        </p>
        <TimerRing
          progress={0}
          size={64}
          stroke={5}
          from="#7c3aed"
          to="#a78bfa"
          label="0%"
          labelClassName="text-sm font-bold text-slate-800 dark:text-white"
          gradientId="day-progress"
        />
      </div>
    </div>

    <div className="mb-3 flex items-center justify-between rounded-xl border-l-2 border-l-orange-500 bg-slate-50 p-4 dark:bg-white/[0.02]">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-white/30">
          Top priority
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Sport</p>
      </div>
      <span className="rounded-full bg-linear-to-r from-orange-500 to-red-500 px-3.5 py-2 text-xs font-semibold text-white">
        ▶ Continue
      </span>
    </div>

    <div className="mb-3 grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/8 dark:bg-white/[0.02]">
        <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
        </span>
        <p className="text-lg font-bold text-slate-900 dark:text-white">3</p>
        <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Tasks today
        </p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/8 dark:bg-white/[0.02]">
        <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400">
          <Flame className="h-3 w-3" />
        </span>
        <p className="text-lg font-bold text-slate-900 dark:text-white">3%</p>
        <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Habits
        </p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/8 dark:bg-white/[0.02]">
        <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
          <TimerIcon className="h-3 w-3" />
        </span>
        <p className="text-lg font-bold text-slate-900 dark:text-white">—</p>
        <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Focus today
        </p>
      </div>
    </div>

    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/8 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-white/70">
          <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
          What Flowline noticed
        </span>
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
          3 insights
        </span>
      </div>
      <div className="space-y-2.5">
        <InsightRow color="bg-orange-400">
          <span className="font-medium text-slate-700 dark:text-white/75">Meditation</span> has a
          low completion rate this month — try a smaller daily target.
        </InsightRow>
        <InsightRow color="bg-emerald-400">
          You completed{' '}
          <span className="font-medium text-slate-700 dark:text-white/75">9 tasks</span> today.
          You&apos;re on a productive streak.
        </InsightRow>
        <InsightRow color="bg-blue-400">
          No focus session yet today —{' '}
          <span className="font-medium text-slate-700 dark:text-white/75">Set up workspaces</span>{' '}
          is your next task.
        </InsightRow>
      </div>
    </div>
  </div>
)
