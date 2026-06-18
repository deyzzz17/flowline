export const HabitsContent = () => (
  <div>
    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-orange-400">Habits</p>
    <h3 className="mb-1 text-lg font-bold text-white">Daily habits</h3>
    <p className="mb-2 text-[10px] text-white/30">0/1 completed today</p>
    <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/5">
      <div className="h-full w-0 rounded-full bg-orange-500" />
    </div>

    <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/2 p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-500/40 text-[11px] text-violet-400">
          ✓
        </span>
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
            Meditation
            <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] font-normal text-white/30">
              Health
            </span>
          </p>
          <p className="text-[9px] text-white/30">Every day</p>
        </div>
      </div>
      <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
        3%
      </span>
    </div>

    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg border border-white/6 bg-white/2 p-2">
        <p className="text-sm font-bold text-white">0</p>
        <p className="text-[8px] uppercase tracking-wide text-white/25">Current streak</p>
      </div>
      <div className="rounded-lg border border-white/6 bg-white/2 p-2">
        <p className="text-sm font-bold text-white">1</p>
        <p className="text-[8px] uppercase tracking-wide text-white/25">Longest streak</p>
      </div>
      <div className="rounded-lg border border-white/6 bg-white/2 p-2">
        <p className="text-sm font-bold text-white">3%</p>
        <p className="text-[8px] uppercase tracking-wide text-white/25">30d completion</p>
      </div>
    </div>
  </div>
)
