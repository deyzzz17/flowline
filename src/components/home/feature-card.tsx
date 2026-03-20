export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  gradientDark,
  iconLight,
  iconDarkBg,
  iconDarkColor,
  delay = 0,
}: {
  icon: React.ElementType
  title: string
  description: string
  gradientDark: string
  iconLight: string
  iconDarkBg: string
  iconDarkColor: string
  delay?: number
}) => {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:border-slate-300 hover:shadow-lg hover:shadow-violet-500/8 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:border-white/20 dark:hover:shadow-2xl dark:hover:shadow-violet-500/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl hidden dark:block bg-linear-to-br ${gradientDark}`}
      />
      <div className="relative z-10">
        <div
          className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl p-2.5 dark:hidden ${iconLight}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div
          className={`mb-4 hidden h-11 w-11 items-center justify-center rounded-xl p-2.5 dark:inline-flex ${iconDarkBg} ${iconDarkColor}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-500 dark:text-white/50">{description}</p>
      </div>
    </div>
  )
}
