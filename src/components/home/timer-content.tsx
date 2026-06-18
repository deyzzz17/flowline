import { TimerRing } from '@/components/home/timer-ring'

export const TimerContent = () => (
  <div className="flex flex-col items-center py-1">
    <p className="mb-1 self-start text-[11px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
      Focus session
    </p>
    <p className="mb-4 self-start text-[9px] uppercase tracking-wide text-slate-400 dark:text-white/25">
      Free timer
    </p>

    <div className="relative">
      <div className="absolute inset-0 -m-2 rounded-full bg-violet-500/10 blur-xl dark:bg-violet-500/20" />
      <TimerRing
        progress={0}
        size={100}
        stroke={6}
        from="#7c3aed"
        to="#3b82f6"
        label="00:00:00"
        labelClassName="text-sm font-bold tabular-nums text-slate-800 dark:text-white"
        gradientId="timer-content"
      />
    </div>

    <span className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs text-white">
      ▶
    </span>

    <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-white/60">—</p>
        <p className="text-[8px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Sessions
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-white/60">—</p>
        <p className="text-[8px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Focus time
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-white/60">—</p>
        <p className="text-[8px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Longest
        </p>
      </div>
    </div>
  </div>
)
