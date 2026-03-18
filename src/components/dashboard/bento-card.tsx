export const BentoCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:border-white/20 ${className}`}
    >
      {children}
    </div>
  )
}
