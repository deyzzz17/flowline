'use client'

import { useState } from 'react'
import { TimeSeriesChart } from './time-series-chart'
import { ChartTypeToggle, type ChartType } from './chart-type-toggle'
import { cn } from '@/lib/utils'
import type { TimeSeriesPoint, SeriesDefinition } from '@/api/timer/actions'

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

  const categories = ['All', ...allCategories.map((c) => c.name)]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
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

      <TimeSeriesChart
        data={data}
        series={series}
        chartType={chartType}
        filter="subcategory"
        filterCategory={selectedCategory === 'All' ? undefined : selectedCategory}
        height={200}
      />
    </div>
  )
}
