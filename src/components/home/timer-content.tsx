import { Clock, Timer as TimerIcon, TrendingUp, Star } from 'lucide-react'
import { TimerRing } from '@/components/home/timer-ring'

const statCards = [
  {
    icon: Clock,
    value: '5h 16m',
    label: 'Total focus time',
    bg: 'bg-violet-50 dark:bg-violet-500/15',
    color: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: TimerIcon,
    value: '28',
    label: 'Sessions',
    bg: 'bg-blue-50 dark:bg-blue-500/15',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: TrendingUp,
    value: '11m',
    label: 'Avg session',
    bg: 'bg-emerald-50 dark:bg-emerald-500/15',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Star,
    value: '5.0',
    label: 'Focus quality',
    bg: 'bg-orange-50 dark:bg-orange-500/15',
    color: 'text-orange-600 dark:text-orange-400',
  },
]

export const TimerContent = () => (
  <div>
    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
      Focus insights
    </p>
    <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Where your time goes</h3>

    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {statCards.map((s) => (
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

    <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/6 dark:bg-white/[0.02]">
      <p className="mb-1.5 text-[9px] uppercase tracking-wide text-slate-400 dark:text-white/25">
        Time by category — this year
      </p>
      <svg viewBox="0 0 200 50" className="h-10 w-full overflow-visible">
        <polyline
          points="0,42 30,43 60,41 85,8 110,40 140,42 170,41 200,42"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-white/6 dark:bg-white/[0.02]">
      <TimerRing
        progress={0.85}
        size={64}
        stroke={7}
        from="#7c3aed"
        to="#a78bfa"
        label="5h 16m"
        labelClassName="text-[9px] font-bold text-slate-800 dark:text-white"
        gradientId="focus-donut"
      />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Flowline
          </span>
          <span className="font-medium text-slate-400 dark:text-white/30">98%</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
            Other categories
          </span>
          <span className="font-medium text-slate-400 dark:text-white/30">2%</span>
        </div>
      </div>
    </div>
  </div>
)
