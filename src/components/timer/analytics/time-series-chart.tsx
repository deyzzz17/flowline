'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { EmptyState } from './empty-state'
import type { ChartType } from './chart-type-toggle'
import type { TimeSeriesPoint, SeriesDefinition } from '@/api/timer-analytics/actions'

function formatSeconds(s: number): string {
  if (!s || s === 0) return '0m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const nonZero = payload.filter((p: any) => (p.value as number) > 0)
  if (!nonZero.length) return null

  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2.5 shadow-lg text-xs space-y-1.5 min-w-[140px]">
      <p className="font-semibold text-foreground border-b border-border/40 pb-1.5">{label}</p>
      {nonZero.map((p: any) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: p.fill ?? p.stroke ?? '#8b5cf6' }}
            />
            <span className="text-muted-foreground truncate max-w-[80px]">{p.name}</span>
          </div>
          <span className="font-medium text-foreground tabular-nums">
            {formatSeconds(p.value as number)}
          </span>
        </div>
      ))}
    </div>
  )
}

const CustomLegend = ({ payload }: any) => {
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[]
  series: SeriesDefinition[]
  chartType: ChartType
  height?: number
  filter?: 'category' | 'subcategory' | 'all'
  filterCategory?: string
}

export function TimeSeriesChart({
  data,
  series,
  chartType,
  height = 220,
  filter = 'all',
  filterCategory,
}: TimeSeriesChartProps) {
  const filteredSeries = series.filter((s) => {
    if (filter === 'category') return s.type === 'category'
    if (filter === 'subcategory') {
      if (filterCategory) return s.type === 'subcategory' && s.parentCategory === filterCategory
      return s.type === 'subcategory'
    }
    return true
  })

  const hasData = data.some((point) => filteredSeries.some((s) => (point[s.key] as number) > 0))

  if (!hasData || filteredSeries.length === 0) {
    return <EmptyState message="Complete sessions with categories to see time trends." />
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.01 286 / 0.08)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'oklch(0.55 0.016 286)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatSeconds}
          tick={{ fontSize: 10, fill: 'oklch(0.55 0.016 286)' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Legend content={<CustomLegend />} />

        {filteredSeries.map((s) =>
          chartType === 'bar' ? (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              shape={(props: any) => {
                const { x, y, width, height: h } = props
                if (!h || h <= 0) return <g />
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={h}
                    fill={s.color}
                    fillOpacity={0.85}
                    rx={4}
                    ry={4}
                  />
                )
              }}
            />
          ) : (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ fill: s.color, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: s.color, strokeWidth: 0 }}
              type="monotone"
            />
          ),
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
