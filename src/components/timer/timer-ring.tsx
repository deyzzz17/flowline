'use client'

import type { TimerPhase } from '@/hooks/timer/use-timer'

const SIZE = 420
const STROKE = 16
const CENTER = SIZE / 2
const RADIUS = CENTER - STROKE / 2 - 8
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const PHASE_COLORS: Record<TimerPhase, string> = {
  work: 'oklch(0.62 0.2 277)',
  break: 'oklch(0.6 0.18 220)',
  free: 'oklch(0.62 0.2 277)', 
}

const PHASE_GLOW: Record<TimerPhase, string> = {
  work: 'oklch(0.59 0.2 277 / 0.15)',
  break: 'oklch(0.55 0.18 220 / 0.15)',
  free: 'oklch(0.59 0.2 277 / 0.15)',
}

interface TimerRingProps {
  progress: number
  isFreeMode: boolean
  isRunning: boolean
  phase: TimerPhase
}

export function TimerRing({ progress, isFreeMode, isRunning, phase }: TimerRingProps) {
  const offset = isFreeMode ? 0 : CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)))
  const color = PHASE_COLORS[phase]
  const glow = PHASE_GLOW[phase]

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full h-full -rotate-90"
      style={{ filter: `drop-shadow(0 0 24px ${glow})` }}
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
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{
          transition: isRunning
            ? 'stroke-dashoffset 1s linear, stroke 0.6s ease'
            : 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1), stroke 0.6s ease',
        }}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS + STROKE / 2 + 12}
        fill="none"
        stroke={`${color.replace(')', ' / 0.06)')}`}
        strokeWidth={1}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS - STROKE / 2 - 10}
        fill="none"
        stroke={`${color.replace(')', ' / 0.04)')}`}
        strokeWidth={1}
      />
    </svg>
  )
}
