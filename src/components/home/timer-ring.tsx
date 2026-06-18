export const TimerRing = ({
  progress = 0.38,
  size = 96,
  stroke = 6,
  from = '#ec4899',
  to = '#f43f5e',
  label = '15:32',
  labelClassName = 'text-base font-bold tabular-nums text-white',
  gradientId = 'timer-grad',
}: {
  progress?: number
  size?: number
  stroke?: number
  from?: string
  to?: string
  label?: string
  labelClassName?: string
  gradientId?: string
}) => {
  const r = (size - stroke) / 2
  const c = size / 2
  const circumference = 2 * Math.PI * r

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ height: size, width: size }}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-white/10"
        />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
      </svg>
      <span className={labelClassName}>{label}</span>
    </div>
  )
}
