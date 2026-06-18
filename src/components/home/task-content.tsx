const TaskRow = ({ dot, label }: { dot: string; label: string }) => (
  <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/6 dark:bg-white/[0.02]">
    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300 dark:border-white/20" />
    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
    <span className="truncate text-[11px] font-medium text-slate-700 dark:text-white/80">
      {label}
    </span>
  </div>
)

export const TasksContent = () => (
  <div>
    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
      List
    </p>
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Flowline</h3>
      <span className="text-[9px] text-slate-400 dark:text-white/30">5 active · 9 completed</span>
    </div>

    <div className="mb-3 flex gap-1.5">
      {['To do · 5', 'Achieved', 'Inactive', 'Trash'].map((t, i) => (
        <span
          key={t}
          className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${
            i === 0
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/35'
          }`}
        >
          {t}
        </span>
      ))}
    </div>

    <div className="space-y-1.5">
      <TaskRow dot="bg-blue-500" label="Set up workspaces" />
      <TaskRow dot="bg-blue-500" label="Set up shared lists" />
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/6 dark:bg-white/[0.02]">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300 dark:border-white/20" />
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          <span className="text-[11px] font-medium text-slate-700 dark:text-white/80">Stripe</span>
          <span className="ml-auto text-[9px] text-slate-400 dark:text-white/25">0/3</span>
        </div>
        <div className="h-1 rounded-full bg-slate-200 dark:bg-white/5">
          <div className="h-full w-0 rounded-full bg-blue-500" />
        </div>
      </div>
    </div>
  </div>
)
