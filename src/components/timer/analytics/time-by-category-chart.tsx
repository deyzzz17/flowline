'use client'

import { useState } from 'react'
import { TimeSeriesChart } from './time-series-chart'
import { ChartTypeToggle, type ChartType } from './chart-type-toggle'
import type { TimeSeriesPoint, SeriesDefinition } from '@/api/timer/actions'

interface TimeByCategoryChartProps {
  data: TimeSeriesPoint[]
  series: SeriesDefinition[]
}

export function TimeByCategoryChart({ data, series }: TimeByCategoryChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ChartTypeToggle value={chartType} onChange={setChartType} />
      </div>
      <TimeSeriesChart
        data={data}
        series={series}
        chartType={chartType}
        filter="category"
        height={220}
      />
    </div>
  )
}
