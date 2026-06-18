import { Repeat } from 'lucide-react'

const dayHeaders = [
  { d: 14, label: 'SUN' },
  { d: 15, label: 'MON' },
  { d: 16, label: 'TUE' },
  { d: 17, label: 'WED' },
  { d: 18, label: 'THU', today: true },
  { d: 19, label: 'FRI' },
  { d: 20, label: 'SAT' },
]

const hours = ['04h', '05h', '06h', '07h', '08h', '09h']

export const CalendarContent = () => (
  <div>
    <div className="mb-3 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Calendar
        </p>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">June 14 – 20</h3>
      </div>
      <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[9px] font-semibold text-white">
        + New event
      </span>
    </div>

    <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-white/6">
      <div className="grid grid-cols-[24px_repeat(7,1fr)] border-b border-slate-100 bg-slate-50 dark:border-white/6 dark:bg-white/[0.02]">
        <span />
        {dayHeaders.map((d) => (
          <div key={d.d} className="flex flex-col items-center py-1.5">
            <span className="text-[6px] font-medium text-slate-400 dark:text-white/25">
              {d.label}
            </span>
            <span
              className={`mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-semibold ${
                d.today ? 'bg-violet-500 text-white' : 'text-slate-600 dark:text-white/60'
              }`}
            >
              {d.d}
            </span>
          </div>
        ))}
      </div>

      {hours.map((h, hi) => (
        <div
          key={h}
          className="grid grid-cols-[24px_repeat(7,1fr)] border-b border-slate-50 last:border-b-0 dark:border-white/4"
          style={{ height: '22px' }}
        >
          <span className="flex items-start justify-end pr-1 pt-0.5 text-[6px] text-slate-300 dark:text-white/15">
            {h}
          </span>
          {dayHeaders.map((d) => (
            <div key={d.d} className="relative border-l border-slate-50 dark:border-white/4">
              {hi < 4 && (
                <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-blue-400/70" />
              )}
              {hi === 3 && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 -translate-x-1/2 bg-blue-400/70" />
              )}
              {hi === 4 && (
                <span className="absolute inset-x-0.5 inset-y-0.5 flex items-center overflow-hidden rounded-sm border-l-2 border-orange-500 bg-orange-500/15 pl-1">
                  <span className="truncate text-[5px] font-medium text-orange-600 dark:text-orange-400">
                    Meditation
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>

    <p className="mt-3 flex items-center gap-1 text-[10px] text-slate-400 dark:text-white/25">
      <Repeat className="h-2.5 w-2.5 text-orange-500" />
      Linked to the habit — shows up on its own, every day at 8:00.
    </p>
  </div>
)
