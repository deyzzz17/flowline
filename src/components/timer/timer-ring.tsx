'use client'

interface TimerRingProps {
  progress: number
  isFreeMode: boolean
  isRunning: boolean
}

const SIZE = 420
const STROKE = 16
const CENTER = SIZE / 2
const RADIUS = CENTER - STROKE / 2 - 8
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function TimerRing({ progress, isFreeMode, isRunning }: TimerRingProps) {
  const offset = isFreeMode ? 0 : CIRCUMFERENCE * (1 - progress)

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full h-full -rotate-90"
      style={{ filter: 'drop-shadow(0 0 24px oklch(0.59 0.2 277 / 0.15))' }}
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke="oklch(0.5 0.01 286 / 0.12)"
        strokeWidth={STROKE}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke="oklch(0.62 0.2 277)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{
          transition: isRunning
            ? 'stroke-dashoffset 1s linear'
            : 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS + STROKE / 2 + 12}
        fill="none"
        stroke="oklch(0.62 0.2 277 / 0.06)"
        strokeWidth={1}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS - STROKE / 2 - 10}
        fill="none"
        stroke="oklch(0.62 0.2 277 / 0.04)"
        strokeWidth={1}
      />
    </svg>
  )
}
