'use client'

interface TimerRingProps {
  progress: number
  isFreeMode: boolean
  isRunning: boolean
  size?: number
  strokeWidth?: number
}

export function TimerRing({
  progress,
  isFreeMode,
  isRunning,
  size = 420,
  strokeWidth = 16,
}: TimerRingProps) {
  const center = size / 2
  const radius = center - strokeWidth / 2 - 8
  const circumference = 2 * Math.PI * radius
  const offset = isFreeMode ? 0 : circumference * (1 - progress)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90 size-full"
      style={{ filter: 'drop-shadow(0 0 24px oklch(0.59 0.2 277 / 0.15))' }}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="oklch(0.5 0.01 286 / 0.12)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="oklch(0.62 0.2 277)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: isRunning
            ? 'stroke-dashoffset 1s linear'
            : 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      <circle
        cx={center}
        cy={center}
        r={radius + strokeWidth / 2 + 12}
        fill="none"
        stroke="oklch(0.62 0.2 277 / 0.06)"
        strokeWidth={1}
      />
      <circle
        cx={center}
        cy={center}
        r={radius - strokeWidth / 2 - 10}
        fill="none"
        stroke="oklch(0.62 0.2 277 / 0.04)"
        strokeWidth={1}
      />
    </svg>
  )
}
