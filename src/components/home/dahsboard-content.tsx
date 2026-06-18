import { CheckCircle2, CalendarClock, Flame, Timer as TimerIcon } from 'lucide-react'
import { TimerRing } from '@/components/home/timer-ring'

export const DashboardContent = () => (
  <div>
    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-violet-400">Dashboard</p>
    <h3 className="mb-4 text-lg font-bold text-white">Good morning, Sophie</h3>

    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-white/8 bg-white/2 p-3.5">
        <p className="mb-3 text-[11px] font-medium text-white/50">Today at a glance</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
              <CheckCircle2 className="h-3 w-3" />
            </span>
            <div>
              <p className="text-[11px] font-medium text-white/80">3 tasks remaining</p>
              <p className="text-[9px] text-white/30">None completed yet</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-400">
              <CalendarClock className="h-3 w-3" />
            </span>
            <div>
              <p className="text-[11px] font-medium text-white/80">1 event today</p>
              <p className="text-[9px] text-white/30">Next: Dormir at 9:00 PM</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Flame className="h-3 w-3" />
            </span>
            <div>
              <p className="text-[11px] font-medium text-white/80">0/1 habits done</p>
              <p className="text-[9px] text-white/30">1 remaining</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
              <TimerIcon className="h-3 w-3" />
            </span>
            <div>
              <p className="text-[11px] font-medium text-white/80">No focus session yet</p>
              <p className="text-[9px] text-white/30">Start the timer to track focus</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden flex-col items-center justify-center rounded-xl border border-white/8 bg-white/2 p-3.5 sm:flex">
        <p className="mb-2 text-[9px] uppercase tracking-wide text-white/25">Day progress</p>
        <TimerRing
          progress={0}
          size={56}
          stroke={5}
          from="#7c3aed"
          to="#a78bfa"
          label="0%"
          labelClassName="text-xs font-bold text-white"
          gradientId="day-progress"
        />
      </div>
    </div>

    <div className="mb-3 flex items-center justify-between rounded-xl border-l-2 border-l-orange-500 bg-white/2 p-3.5">
      <div>
        <p className="text-[9px] font-medium uppercase tracking-wide text-white/30">Top priority</p>
        <p className="text-sm font-semibold text-white">Sport</p>
      </div>
      <span className="rounded-full bg-linear-to-r from-orange-500 to-red-500 px-3 py-1.5 text-[10px] font-semibold text-white">
        ▶ Continue
      </span>
    </div>

    <div className="grid grid-cols-3 gap-2.5">
      <div className="rounded-xl border border-white/8 bg-white/2 p-2.5">
        <span className="mb-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-2.5 w-2.5" />
        </span>
        <p className="text-base font-bold text-white">3</p>
        <p className="text-[9px] uppercase tracking-wide text-white/25">Tasks today</p>
      </div>
      <div className="rounded-xl border border-white/8 bg-white/2 p-2.5">
        <span className="mb-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
          <Flame className="h-2.5 w-2.5" />
        </span>
        <p className="text-base font-bold text-white">3%</p>
        <p className="text-[9px] uppercase tracking-wide text-white/25">Habits</p>
      </div>
      <div className="rounded-xl border border-white/8 bg-white/2 p-2.5">
        <span className="mb-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
          <TimerIcon className="h-2.5 w-2.5" />
        </span>
        <p className="text-base font-bold text-white">—</p>
        <p className="text-[9px] uppercase tracking-wide text-white/25">Focus today</p>
      </div>
    </div>
  </div>
)
