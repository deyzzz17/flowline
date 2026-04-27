'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { EmptyState } from './empty-state'

interface FocusDataPoint {
  name: string
  avgRating: number
  sessions: number
  color: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as FocusDataPoint
  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2.5 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-amber-400">{d.avgRating.toFixed(1)} ★</p>
      <p className="text-muted-foreground">
        {d.sessions} session{d.sessions > 1 ? 's' : ''}
      </p>
    </div>
  )
}

interface FocusQualityChartProps {
  global: { avgRating: number; sessions: number }
  byCategory: { name: string; color: string; avgRating: number; sessions: number }[]
}

export function FocusQualityChart({ global: globalData, byCategory }: FocusQualityChartProps) {
  if (globalData.sessions === 0) {
    return <EmptyState message="Rate your sessions to see focus quality insights." />
  }

  const chartData: FocusDataPoint[] = [
    {
      name: 'Global',
      avgRating: globalData.avgRating,
      sessions: globalData.sessions,
      color: '#8b5cf6',
    },
    ...byCategory,
  ]

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.5 0.01 286 / 0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'oklch(0.55 0.016 286)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 10, fill: 'oklch(0.55 0.016 286)' }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine y={3} stroke="oklch(0.5 0.01 286 / 0.2)" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0.5 0.01 286 / 0.05)' }} />
          <Bar
            dataKey="avgRating"
            radius={[6, 6, 0, 0]}
            shape={(props) => {
              const { x, y, width, height, index } = props
              const color = chartData[index]?.color ?? '#8b5cf6'
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={color}
                  fillOpacity={0.85}
                  rx={6}
                  ry={6}
                />
              )
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="grid grid-cols-4 border-b border-border/40 px-4 py-2 bg-muted/20">
          {['Category', 'Avg rating', 'Sessions', ''].map((h, i) => (
            <p
              key={i}
              className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60"
            >
              {h}
            </p>
          ))}
        </div>
        <div className="divide-y divide-border/30">
          {chartData.map((d) => (
            <div
              key={d.name}
              className="grid grid-cols-4 px-4 py-2.5 items-center hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-xs font-medium text-foreground">{d.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground">
                  {d.avgRating.toFixed(1)}
                </span>
                <span className="text-[10px] text-amber-400">★</span>
              </div>
              <span className="text-xs text-muted-foreground">{d.sessions}</span>
              <span className="text-xs text-muted-foreground/40">—</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
