export const AppWindow = ({
  children,
  className = '',
  label,
}: {
  children: React.ReactNode
  className?: string
  label?: string
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/5 dark:border-white/10 dark:bg-[oklch(0.09_0.005_285)] dark:shadow-black/40 ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3 dark:border-white/6">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-white/10" />
        {label && (
          <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/30">
            {label}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}
