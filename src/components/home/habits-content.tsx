export const HabitsContent = () => (
  <div>
    <div className="mb-1 flex items-center justify-between">
      <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
        Habits
      </p>
      <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[9px] font-semibold text-white">
        + New habit
      </span>
    </div>
    <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">Daily habits</h3>
    <p className="mb-2 text-[10px] text-slate-400 dark:text-white/30">0/1 completed today</p>
    <div className="mb-3 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/5">
      <div className="h-full w-0 rounded-full bg-orange-500" />
    </div>

    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/6 dark:bg-white/[0.02]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-300 text-[11px] text-violet-600 dark:border-violet-500/40 dark:text-violet-400">
          ✓
        </span>
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-white/80">
            Meditation
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-normal text-slate-400 dark:bg-white/5 dark:text-white/30">
              Health
            </span>
          </p>
          <p className="text-[9px] text-slate-400 dark:text-white/30">Every day</p>
        </div>
      </div>
      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
        3%
      </span>
    </div>

    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-white/6 dark:bg-white/[0.02]">
        <p className="text-sm font-bold text-slate-900 dark:text-white">0</p>
        <p className="text-[8px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Current streak
        </p>
      </div>
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-white/6 dark:bg-white/[0.02]">
        <p className="text-sm font-bold text-slate-900 dark:text-white">1</p>
        <p className="text-[8px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Longest streak
        </p>
      </div>
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-white/6 dark:bg-white/[0.02]">
        <p className="text-sm font-bold text-slate-900 dark:text-white">3%</p>
        <p className="text-[8px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          30d completion
        </p>
      </div>
    </div>

    <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-white/6 dark:bg-white/[0.02]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[8px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Last 14 days
        </p>
        <span className="flex items-center gap-1 text-[8px] text-slate-300 dark:text-white/15">
          Less
          <span className="h-2 w-2 rounded-sm bg-slate-200 dark:bg-white/10" />
          <span className="h-2 w-2 rounded-sm bg-violet-500" />
          More
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className={`h-3 flex-1 rounded-sm ${
              i === 11 ? 'bg-violet-500' : 'bg-slate-100 dark:bg-white/5'
            }`}
          />
        ))}
      </div>
    </div>
  </div>
)
