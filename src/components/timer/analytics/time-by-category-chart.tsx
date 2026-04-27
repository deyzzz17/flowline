'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { TimePeriod } from './time-period-selector'

interface DataPoint {
  name: string
  minutes: number
  color: string
}

const MOCK_DATA: Record<TimePeriod, DataPoint[]> = {
  day: [
    { name: 'Work', minutes: 142, color: '#6366f1' },
    { name: 'Study', minutes: 65, color: '#0ea5e9' },
    { name: 'Health', minutes: 30, color: '#10b981' },
    { name: 'Personal', minutes: 20, color: '#f59e0b' },
    { name: 'Creative', minutes: 45, color: '#ec4899' },
  ],
  week: [
    { name: 'Work', minutes: 860, color: '#6366f1' },
    { name: 'Study', minutes: 320, color: '#0ea5e9' },
    { name: 'Health', minutes: 210, color: '#10b981' },
    { name: 'Personal', minutes: 95, color: '#f59e0b' },
    { name: 'Creative', minutes: 180, color: '#ec4899' },
  ],
  month: [
    { name: 'Work', minutes: 3600, color: '#6366f1' },
    { name: 'Study', minutes: 1240, color: '#0ea5e9' },
    { name: 'Health', minutes: 840, color: '#10b981' },
    { name: 'Personal', minutes: 380, color: '#f59e0b' },
    { name: 'Creative', minutes: 720, color: '#ec4899' },
  ],
  year: [
    { name: 'Work', minutes: 43200, color: '#6366f1' },
    { name: 'Study', minutes: 14880, color: '#0ea5e9' },
    { name: 'Health', minutes: 10080, color: '#10b981' },
    { name: 'Personal', minutes: 4560, color: '#f59e0b' },
    { name: 'Creative', minutes: 8640, color: '#ec4899' },
  ],
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const min = m % 60
  return min > 0 ? `${h}h ${min}m` : `${h}h`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-0.5">{label}</p>
      <p className="text-muted-foreground">{formatMinutes(payload[0].value)}</p>
    </div>
  )
}

interface TimeByCategoryChartProps {
  period: TimePeriod
}

export function TimeByCategoryChart({ period }: TimeByCategoryChartProps) {
  const data = MOCK_DATA[period]

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
          tickFormatter={formatMinutes}
          tick={{ fontSize: 10, fill: 'oklch(0.55 0.016 286)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0.5 0.01 286 / 0.05)' }} />
        <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
