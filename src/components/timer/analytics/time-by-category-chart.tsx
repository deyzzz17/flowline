'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { EmptyState } from './empty-state'

interface DataPoint {
  name: string
  seconds: number
  color: string
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-0.5">{label}</p>
      <p className="text-muted-foreground">{formatSeconds(payload[0].value as number)}</p>
    </div>
  )
}

interface TimeByCategoryChartProps {
  data: DataPoint[]
}

export function TimeByCategoryChart({ data }: TimeByCategoryChartProps) {
  if (data.length === 0)
    return <EmptyState message="Complete sessions with categories to see time breakdown." />

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.01 286 / 0.1)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'oklch(0.55 0.016 286)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatSeconds}
          tick={{ fontSize: 10, fill: 'oklch(0.55 0.016 286)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0.5 0.01 286 / 0.05)' }} />
        <Bar
          dataKey="seconds"
          radius={[6, 6, 0, 0]}
          shape={(props) => {
            const { x, y, width, height, index } = props
            const color = data[index]?.color ?? '#8b5cf6'
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
  )
}
