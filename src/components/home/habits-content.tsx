import { Flame, CheckCircle2, TrendingUp, Trophy } from 'lucide-react'

const stats = [
  {
    icon: Flame,
    value: '1',
    label: 'Active habits',
    bg: 'bg-orange-50 dark:bg-orange-500/15',
    color: 'text-orange-600 dark:text-orange-400',
  },
  {
    icon: CheckCircle2,
    value: '3%',
    label: 'Avg completion',
    bg: 'bg-emerald-50 dark:bg-emerald-500/15',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: CheckCircle2,
    value: '0/1',
    label: 'Today',
    bg: 'bg-blue-50 dark:bg-blue-500/15',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: TrendingUp,
    value: '1',
    label: 'Best streak',
    bg: 'bg-violet-50 dark:bg-violet-500/15',
    color: 'text-violet-600 dark:text-violet-400',
  },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const HabitsContent = () => (
  <div>
    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
      Analytics
    </p>
    <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Habit insights</h3>

    <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-white/6 dark:bg-white/[0.02]"
        >
          <span
            className={`mb-1.5 flex h-5 w-5 items-center justify-center rounded-full ${s.bg} ${s.color}`}
          >
            <s.icon className="h-2.5 w-2.5" />
          </span>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{s.value}</p>
          <p className="text-[7px] uppercase tracking-wide text-slate-400 dark:text-white/25">
            {s.label}
          </p>
        </div>
      ))}
    </div>

    <p className="mb-3 text-center text-[9px] text-slate-400 dark:text-white/30">
      Best streak:{' '}
      <span className="font-semibold text-slate-600 dark:text-white/60">Meditation</span> — 1 day
    </p>

    <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/6 dark:bg-white/[0.02]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9px] font-semibold text-slate-600 dark:text-white/60">
          Completion heatmap
        </p>
        <span className="text-[8px] text-slate-400 dark:text-white/25">2026</span>
      </div>
      <div className="grid grid-cols-12 gap-[2px]">
        {months.map((m, mi) => (
          <div key={m} className="flex flex-col items-center gap-[2px]">
            {Array.from({ length: 3 }).map((_, ri) => (
              <span
                key={ri}
                className={`h-2 w-2 rounded-sm ${
                  mi === 5 && ri === 0 ? 'bg-violet-500' : 'bg-slate-100 dark:bg-white/5'
                }`}
              />
            ))}
            <span className="mt-0.5 text-[5px] text-slate-300 dark:text-white/15">{m}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[7px] text-slate-300 dark:text-white/15">
        Less
        <span className="h-2 w-2 rounded-sm bg-slate-100 dark:bg-white/5" />
        <span className="h-2 w-2 rounded-sm bg-violet-300" />
        <span className="h-2 w-2 rounded-sm bg-violet-500" />
        More
      </div>
    </div>

    <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/6 dark:bg-white/[0.02]">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-600 dark:text-white/60">
          <Trophy className="h-3 w-3 text-amber-500" />
          Goals claimed
        </span>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[7px] text-slate-400 dark:bg-white/5 dark:text-white/30">
          Month
        </span>
      </div>
      <p className="text-center text-[9px] text-slate-400 dark:text-white/25">
        No goals claimed this period
      </p>
    </div>

    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/6 dark:bg-white/[0.02]">
      <p className="mb-2 text-[9px] font-semibold text-slate-600 dark:text-white/60">Per habit</p>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
        <span className="flex-1 truncate text-[10px] font-medium text-slate-700 dark:text-white/80">
          Meditation
        </span>
        <div className="h-1 w-12 shrink-0 rounded-full bg-slate-200 dark:bg-white/10">
          <div className="h-full w-[3%] rounded-full bg-violet-500" />
        </div>
        <span className="shrink-0 text-[9px] text-slate-400 dark:text-white/30">3%</span>
      </div>
    </div>
  </div>
)
