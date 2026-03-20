export const MiniTask = ({ done, label }: { done?: boolean; label: string }) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm dark:border-white/6 dark:bg-white/5">
      <div
        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          done
            ? 'border-violet-500 bg-violet-100 dark:border-violet-400 dark:bg-violet-500/30'
            : 'border-slate-300 dark:border-white/30'
        }`}
      >
        {done && <div className="h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />}
      </div>
      <span
        className={
          done
            ? 'text-slate-400 line-through dark:text-white/40'
            : 'text-slate-700 dark:text-white/80'
        }
      >
        {label}
      </span>
    </div>
  )
}
