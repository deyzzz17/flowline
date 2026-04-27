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
  Cell,
} from 'recharts'

interface FocusDataPoint {
  name: string
  rating: number
  sessions: number
  color: string
}

const MOCK_DATA: FocusDataPoint[] = [
  { name: 'Global', rating: 3.8, sessions: 42, color: '#8b5cf6' },
  { name: 'Work', rating: 4.1, sessions: 18, color: '#6366f1' },
  { name: 'Study', rating: 3.5, sessions: 12, color: '#0ea5e9' },
  { name: 'Health', rating: 4.4, sessions: 6, color: '#10b981' },
  { name: 'Personal', rating: 3.2, sessions: 3, color: '#f59e0b' },
  { name: 'Creative', rating: 4.0, sessions: 7, color: '#ec4899' },
]

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="text-[10px] text-amber-400">
      {'★'.repeat(Math.floor(value))}
      {value % 1 >= 0.5 ? '½' : ''}
      {'☆'.repeat(5 - Math.ceil(value))}
    </span>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as FocusDataPoint
  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2.5 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <StarDisplay value={d.rating} />
        <span className="text-muted-foreground">{d.rating.toFixed(1)}/5</span>
      </div>
      <p className="text-muted-foreground">{d.sessions} sessions</p>
    </div>
  )
}

export function FocusQualityChart() {
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={MOCK_DATA} barSize={28} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
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
          <Bar dataKey="rating" radius={[6, 6, 0, 0]}>
            {MOCK_DATA.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="grid grid-cols-4 gap-0 border-b border-border/40 px-4 py-2 bg-muted/20">
          {['Category', 'Avg rating', 'Sessions', 'Trend'].map((h) => (
            <p
              key={h}
              className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60"
            >
              {h}
            </p>
          ))}
        </div>
        <div className="divide-y divide-border/30">
          {MOCK_DATA.map((d) => (
            <div
              key={d.name}
              className="grid grid-cols-4 gap-0 px-4 py-2.5 items-center hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-xs font-medium text-foreground">{d.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground">{d.rating.toFixed(1)}</span>
                <span className="text-[10px] text-amber-400">★</span>
              </div>
              <span className="text-xs text-muted-foreground">{d.sessions}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">↑ +0.2</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
