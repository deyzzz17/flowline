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
  category: string
  minutes: number
  color: string
}

const ALL_DATA: DataPoint[] = [
  { name: 'Frontend', category: 'Work', minutes: 280, color: '#6366f1' },
  { name: 'Backend', category: 'Work', minutes: 220, color: '#818cf8' },
  { name: 'Meetings', category: 'Work', minutes: 120, color: '#a5b4fc' },
  { name: 'Math', category: 'Study', minutes: 95, color: '#0ea5e9' },
  { name: 'Languages', category: 'Study', minutes: 80, color: '#38bdf8' },
  { name: 'Running', category: 'Health', minutes: 85, color: '#10b981' },
  { name: 'Gym', category: 'Health', minutes: 55, color: '#34d399' },
  { name: 'Design', category: 'Creative', minutes: 75, color: '#ec4899' },
  { name: 'Music', category: 'Creative', minutes: 40, color: '#f472b6' },
]

const CATEGORIES = ['All', 'Work', 'Study', 'Health', 'Creative', 'Personal']

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const min = m % 60
  return min > 0 ? `${h}h ${min}m` : `${h}h`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0].payload as DataPoint
  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground/70 mb-0.5">{item.category}</p>
      <p className="text-muted-foreground">{formatMinutes(payload[0].value)}</p>
    </div>
  )
}

interface TimeBySubcategoryChartProps {
  period: TimePeriod
  selectedCategory: string
  onSelectCategory: (c: string) => void
}

export function TimeBySubcategoryChart({
  selectedCategory,
  onSelectCategory,
}: TimeBySubcategoryChartProps) {
  const data =
    selectedCategory === 'All' ? ALL_DATA : ALL_DATA.filter((d) => d.category === selectedCategory)

  return (
    <div className="space-y-4">
      {/* Filtre catégorie */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={
              selectedCategory === cat
                ? 'rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-600 dark:text-violet-400'
                : 'rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all'
            }
          >
            {cat}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
    </div>
  )
}
