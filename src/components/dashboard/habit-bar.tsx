export const HabitBar = ({ label, pct, color }: { label: string; pct: number; color: string }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-500 dark:text-white/50">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-white/10">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
