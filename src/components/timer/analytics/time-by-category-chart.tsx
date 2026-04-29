'use client'

import { useState } from 'react'
import { TimeSeriesChart } from './time-series-chart'
import { ChartTypeToggle, type ChartType } from './chart-type-toggle'
import { cn } from '@/lib/utils'
import type { TimeSeriesPoint, SeriesDefinition } from '@/api/timer/actions'

function hexToRgba(hex: string, alpha: number) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(139,92,246,${alpha})`
  }
}

interface TimeByCategoryChartProps {
  data: TimeSeriesPoint[]
  series: SeriesDefinition[]
}

export function TimeByCategoryChart({ data, series }: TimeByCategoryChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [selectedKeys, setSelectedKeys] = useState<Set<string> | null>(null) // null = tout affiché

  const categorySeries = series.filter((s) => s.type === 'category')

  const toggleSeries = (key: string) => {
    setSelectedKeys((prev) => {
      if (prev === null) return new Set([key])
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        if (next.size === 0) return null
      } else {
        next.add(key)
      }
      return next
    })
  }

  const filteredSeries =
    selectedKeys === null
      ? series
      : series.filter((s) => s.type !== 'category' || selectedKeys.has(s.key))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {categorySeries.map((s) => {
            const isActive = selectedKeys === null || selectedKeys.has(s.key)
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleSeries(s.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                  isActive
                    ? ''
                    : 'border-border/40 bg-background text-muted-foreground/40 hover:opacity-70',
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: hexToRgba(s.color, 0.12),
                        borderColor: hexToRgba(s.color, 0.4),
                        color: s.color,
                      }
                    : undefined
                }
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: isActive ? s.color : 'currentColor',
                    opacity: isActive ? 1 : 0.4,
                  }}
                />
                {s.name}
              </button>
            )
          })}
        </div>
        <ChartTypeToggle value={chartType} onChange={setChartType} />
      </div>

      <TimeSeriesChart
        data={data}
        series={filteredSeries}
        chartType={chartType}
        filter="category"
        height={220}
      />
    </div>
  )
}
