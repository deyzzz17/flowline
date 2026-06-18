export const LogoMark = ({ className = 'h-7 w-7' }: { className?: string }) => (
  <span
    className={`flex shrink-0 items-center justify-center rounded-lg bg-violet-600 ${className}`}
  >
    <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none">
      <path
        d="M3 17 8 9l3.5 5L14 10l3 4.5L21 17"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
)

export const Logo = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <LogoMark />
    <span className="text-base font-semibold text-slate-900 dark:text-white">Flowline</span>
  </div>
)
