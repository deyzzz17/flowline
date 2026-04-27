'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { EmptyState } from './empty-state'
import { cn } from '@/lib/utils'

interface DataPoint {
  name: string
  category: string
  color: string
  seconds: number
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
  const item = payload[0].payload as DataPoint
  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground/70 mb-0.5">{item.category}</p>
      <p className="text-muted-foreground">{formatSeconds(payload[0].value as number)}</p>
    </div>
  )
}

interface TimeBySubcategoryChartProps {
  data: DataPoint[]
  allCategories: string[]
  selectedCategory: string
  onSelectCategory: (c: string) => void
}

export function TimeBySubcategoryChart({
  data,
  allCategories,
  selectedCategory,
  onSelectCategory,
}: TimeBySubcategoryChartProps) {
  const filtered =
    selectedCategory === 'All' ? data : data.filter((d) => d.category === selectedCategory)
  const categories = ['All', ...allCategories]

  if (data.length === 0)
    return <EmptyState message="Add sub-categories to your sessions to see this breakdown." />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
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

      {filtered.length === 0 ? (
        <EmptyState message="No sub-category data for this category yet." />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={filtered}
            barSize={28}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
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
                const color = filtered[index]?.color ?? '#8b5cf6'
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
      )}
    </div>
  )
}
