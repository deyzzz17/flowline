'use client'

interface TimerRingProps {
  progress: number
  isFreeMode: boolean
  isRunning: boolean
  size?: number
  strokeWidth?: number
  color?: string
}

export const TimerRing = ({
  progress,
  isFreeMode,
  isRunning,
  size = 320,
  strokeWidth = 14,
  color = '#8b5cf6',
}: TimerRingProps) => {
  const center = size / 2
  const radius = center - strokeWidth / 2 - 4
  const circumference = 2 * Math.PI * radius
  const offset = isFreeMode ? 0 : circumference * (1 - progress)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.4s ease',
            filter: `drop-shadow(0 0 8px ${color}60)`,
          }}
        />

        <circle
          cx={center}
          cy={center}
          r={radius + strokeWidth / 2 + 6}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeOpacity={0.12}
          strokeDasharray="4 8"
        />
      </svg>

      <div
        className="absolute inset-0 rounded-full opacity-5"
        style={{
          background: `radial-gradient(circle at center, ${color}, transparent 70%)`,
        }}
      />
    </div>
  )
}
