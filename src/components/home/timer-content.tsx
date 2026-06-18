import { TimerRing } from '@/components/home/timer-ring'

export const TimerContent = () => (
  <div className="flex flex-col items-center py-1">
    <div className="mb-4 flex w-full items-center justify-between">
      <p className="text-[11px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
        Focus session
      </p>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-white/5 dark:text-white/40">
        Free timer
      </span>
    </div>

    <div className="relative">
      <div className="absolute inset-0 -m-2 rounded-full bg-violet-500/10 blur-xl dark:bg-violet-500/20" />
      <TimerRing
        progress={0}
        size={104}
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

    <span className="mt-3 rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:text-white/40">
      ⚙ Customize
    </span>

    <div className="mt-5 w-full">
      <p className="mb-2 text-center text-[8px] uppercase tracking-wide text-slate-400 dark:text-white/25">
        Today
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
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

    <div className="mt-4 flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-white/10" />
      <span className="h-1.5 w-3 rounded-full bg-violet-500" />
      <span className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-white/10" />
    </div>
  </div>
)
