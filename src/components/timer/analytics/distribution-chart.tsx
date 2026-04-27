'use client'

import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts'
import { EmptyState } from './empty-state'

interface DistributionItem {
  name: string
  value: number
  color: string
  __total?: number
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0].payload as DistributionItem
  const pct = item.__total ? Math.round((item.value / item.__total) * 100) : 0
  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-0.5">{item.name}</p>
      <p className="text-muted-foreground">
        {formatSeconds(item.value)} · {pct}%
      </p>
    </div>
  )
}

interface DistributionChartProps {
  categoryData: { name: string; seconds: number; color: string }[]
  subcategoryData: { name: string; category: string; seconds: number; color: string }[]
  selectedCategory: string | null
  onSelectCategory: (name: string | null) => void
}

export function DistributionChart({
  categoryData,
  subcategoryData,
  selectedCategory,
  onSelectCategory,
}: DistributionChartProps) {
  const rawData = selectedCategory
    ? subcategoryData
        .filter((d) => d.category === selectedCategory)
        .map((d) => ({ name: d.name, value: d.seconds, color: d.color }))
    : categoryData.map((d) => ({ name: d.name, value: d.seconds, color: d.color }))

  if (rawData.length === 0)
    return (
      <EmptyState
        message={
          selectedCategory
            ? `No sub-categories for ${selectedCategory} yet.`
            : 'Complete sessions with categories to see distribution.'
        }
      />
    )

  const total = rawData.reduce((s, d) => s + d.value, 0)
  const data: DistributionItem[] = rawData.map((d) => ({ ...d, __total: total }))

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              onClick={(data) => {
                if (!selectedCategory && data?.name) onSelectCategory(data.name)
              }}
              style={{ cursor: selectedCategory ? 'default' : 'pointer' }}
              shape={(props) => {
                const { index } = props
                const color = data[index]?.color ?? '#8b5cf6'
                return <path d={props.d} fill={color} fillOpacity={0.85} stroke="none" />
              }}
            />
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-sm font-semibold text-foreground">{formatSeconds(total)}</p>
          <p className="text-[10px] text-muted-foreground/60">total</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-w-0 flex-1">
        {rawData.map((item) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0
          return (
            <div
              key={item.name}
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => !selectedCategory && onSelectCategory(item.name)}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="flex-1 text-xs text-foreground truncate">{item.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatSeconds(item.value)}
              </span>
              <span className="text-[10px] text-muted-foreground/50 tabular-nums w-8 text-right">
                {pct}%
              </span>
            </div>
          )
        })}
        {selectedCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className="mt-1 text-[11px] text-violet-600 dark:text-violet-400 hover:underline text-left"
          >
            ← Back to categories
          </button>
        )}
      </div>
    </div>
  )
}
