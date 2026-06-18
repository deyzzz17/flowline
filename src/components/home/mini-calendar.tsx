const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const events: Record<number, string[]> = {
  2: ['bg-blue-500'],
  4: ['bg-violet-500'],
  5: ['bg-orange-500', 'bg-blue-500'],
}

export const MiniCalendar = () => {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/6 dark:bg-white/5">
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-400 dark:text-white/30">
        {days.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`flex h-12 flex-col items-center gap-1 rounded-lg pt-1.5 text-[11px] ${
              i === 5
                ? 'bg-violet-100 font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
                : 'text-slate-500 dark:text-white/40'
            }`}
          >
            {15 + i}
            <div className="flex gap-0.5">
              {(events[i] ?? []).map((color, j) => (
                <span key={j} className={`h-1 w-1 rounded-full ${color}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
