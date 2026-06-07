'use client'

import { useState } from 'react'

function formatSeconds(s: number): string {
  if (s === 0) return '0m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

interface Bar {
  label: string
  seconds: number
  isToday?: boolean
}

interface FocusWeeklyBarsProps {
  bars: Bar[]
}

export function FocusWeeklyBars({ bars }: FocusWeeklyBarsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const todayIndex = (new Date().getDay() + 6) % 7

  const maxSeconds = Math.max(...bars.map((b) => b.seconds), 1)

  return (
    <div className="flex items-end gap-0.5 h-10 relative">
      {bars.map((bar, i) => {
        const isToday = i === todayIndex
        const isHovered = hoveredIndex === i
        const heightPct = bar.seconds > 0 ? (bar.seconds / maxSeconds) * 100 : 0

        return (
          <div
            key={bar.label}
            className="relative flex flex-1 flex-col items-center gap-0.5 cursor-default"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {isHovered && (
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="rounded-lg border border-border/60 bg-background px-2.5 py-1.5 shadow-lg whitespace-nowrap">
                  <p className="text-[11px] font-medium text-foreground">
                    {bar.seconds > 0 ? formatSeconds(bar.seconds) : 'No session'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{bar.label}</p>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border/60" />
              </div>
            )}

            <div className="w-full flex flex-col justify-end" style={{ height: 36 }}>
              <div
                className={`w-full rounded-sm transition-all duration-300 ${
                  isToday
                    ? isHovered
                      ? 'bg-pink-400 dark:bg-pink-300'
                      : 'bg-pink-500 dark:bg-pink-400'
                    : bar.seconds > 0
                      ? isHovered
                        ? 'bg-pink-300 dark:bg-pink-700'
                        : 'bg-pink-200 dark:bg-pink-900'
                      : 'bg-muted'
                }`}
                style={{
                  height: `${Math.max(heightPct, bar.seconds > 0 ? 10 : 3)}%`,
                }}
              />
            </div>

            <span
              className="text-[9px] text-muted-foreground/60 leading-none select-none"
              spellCheck={false}
            >
              {bar.label.slice(0, 1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
