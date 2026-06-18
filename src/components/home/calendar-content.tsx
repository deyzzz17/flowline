const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
}

const days = [
  { d: 14, ev: [{ c: 'blue', l: 'Dormir' }] },
  {
    d: 15,
    ev: [
      { c: 'blue', l: 'Dormir' },
      { c: 'violet', l: 'Meditation' },
    ],
  },
  {
    d: 16,
    ev: [
      { c: 'blue', l: 'Dormir' },
      { c: 'violet', l: 'Meditation' },
    ],
  },
  {
    d: 17,
    ev: [
      { c: 'blue', l: 'Dormir' },
      { c: 'violet', l: 'Meditation' },
    ],
  },
  {
    d: 18,
    ev: [
      { c: 'blue', l: 'Dormir' },
      { c: 'violet', l: 'Meditation' },
    ],
    today: true,
  },
  {
    d: 19,
    ev: [
      { c: 'blue', l: 'Dormir' },
      { c: 'violet', l: 'Meditation' },
    ],
  },
  { d: 20, ev: [{ c: 'blue', l: 'Dormir' }] },
  { d: 21, ev: [{ c: 'blue', l: 'Dormir' }] },
  {
    d: 22,
    ev: [
      { c: 'blue', l: 'Dormir' },
      { c: 'violet', l: 'Meditation' },
    ],
  },
  {
    d: 23,
    ev: [
      { c: 'blue', l: 'Dormir' },
      { c: 'violet', l: 'Meditation' },
    ],
  },
  {
    d: 24,
    ev: [
      { c: 'blue', l: 'Dormir' },
      { c: 'violet', l: 'Meditation' },
    ],
  },
  {
    d: 25,
    ev: [
      { c: 'blue', l: 'Dormir' },
      { c: 'violet', l: 'Meditation' },
    ],
  },
  { d: 26, ev: [{ c: 'blue', l: 'Dormir' }] },
  { d: 27, ev: [{ c: 'blue', l: 'Dormir' }] },
]

export const CalendarContent = () => (
  <div>
    <div className="mb-3 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Calendar
        </p>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">June 2026</h3>
      </div>
      <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[9px] font-semibold text-white">
        + New event
      </span>
    </div>

    <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-medium text-slate-400 dark:text-white/25">
      {headers.map((h, i) => (
        <span key={i}>{h}</span>
      ))}
    </div>
    <div className="mt-1 grid grid-cols-7 gap-1">
      {days.map((cell) => (
        <div
          key={cell.d}
          className="min-h-[52px] rounded-lg border border-slate-100 bg-slate-50 p-1 dark:border-white/6 dark:bg-white/[0.02]"
        >
          <span
            className={`mb-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
              cell.today
                ? 'bg-violet-500 font-semibold text-white'
                : 'text-slate-500 dark:text-white/45'
            }`}
          >
            {cell.d}
          </span>
          <div className="space-y-0.5">
            {cell.ev.map((e, j) => (
              <span
                key={j}
                className={`block truncate rounded px-1 py-0.5 text-[7px] ${colorMap[e.c]}`}
              >
                {e.l}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/6 dark:bg-white/[0.02]">
      <span className="h-6 w-1 rounded-full bg-violet-500" />
      <div>
        <p className="text-[9px] uppercase tracking-wide text-slate-400 dark:text-white/25">
          Today
        </p>
        <p className="text-[11px] font-medium text-slate-700 dark:text-white/80">
          9:00 PM · Dormir
        </p>
      </div>
    </div>
  </div>
)
