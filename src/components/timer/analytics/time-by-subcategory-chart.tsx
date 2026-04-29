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

interface TimeBySubcategoryChartProps {
  data: TimeSeriesPoint[]
  series: SeriesDefinition[]
  allCategories: { name: string; color: string }[]
}

export function TimeBySubcategoryChart({
  data,
  series,
  allCategories,
}: TimeBySubcategoryChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedKeys, setSelectedKeys] = useState<Set<string> | null>(null)

  const categories = ['All', ...allCategories.map((c) => c.name)]

  const visibleSubSeries = series.filter((s) => {
    if (s.type !== 'subcategory') return false
    if (selectedCategory === 'All') return true
    return s.parentCategory === selectedCategory
  })

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

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setSelectedKeys(null)
  }

  const filteredSeries =
    selectedKeys === null
      ? series
      : series.filter((s) => s.type !== 'subcategory' || selectedKeys.has(s.key))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                selectedCategory === cat
                  ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                  : 'border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <ChartTypeToggle value={chartType} onChange={setChartType} />
      </div>

      {visibleSubSeries.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleSubSeries.map((s) => {
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
      )}

      <TimeSeriesChart
        data={data}
        series={filteredSeries}
        chartType={chartType}
        filter="subcategory"
        filterCategory={selectedCategory === 'All' ? undefined : selectedCategory}
        height={200}
      />
    </div>
  )
}
