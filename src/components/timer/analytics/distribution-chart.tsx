'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface DistributionItem {
  name: string
  value: number
  color: string
}

const CATEGORY_DATA: DistributionItem[] = [
  { name: 'Work', value: 3600, color: '#6366f1' },
  { name: 'Study', value: 1240, color: '#0ea5e9' },
  { name: 'Health', value: 840, color: '#10b981' },
  { name: 'Personal', value: 380, color: '#f59e0b' },
  { name: 'Creative', value: 720, color: '#ec4899' },
]

const SUBCATEGORY_DATA: Record<string, DistributionItem[]> = {
  Work: [
    { name: 'Frontend', value: 1400, color: '#6366f1' },
    { name: 'Backend', value: 1100, color: '#818cf8' },
    { name: 'Meetings', value: 600, color: '#a5b4fc' },
    { name: 'Other', value: 500, color: '#c7d2fe' },
  ],
  Study: [
    { name: 'Math', value: 480, color: '#0ea5e9' },
    { name: 'Languages', value: 420, color: '#38bdf8' },
    { name: 'History', value: 340, color: '#7dd3fc' },
  ],
  Health: [
    { name: 'Running', value: 420, color: '#10b981' },
    { name: 'Gym', value: 280, color: '#34d399' },
    { name: 'Yoga', value: 140, color: '#6ee7b7' },
  ],
  Personal: [
    { name: 'Admin', value: 200, color: '#f59e0b' },
    { name: 'Reading', value: 180, color: '#fbbf24' },
  ],
  Creative: [
    { name: 'Design', value: 380, color: '#ec4899' },
    { name: 'Music', value: 200, color: '#f472b6' },
    { name: 'Writing', value: 140, color: '#f9a8d4' },
  ],
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? (min > 0 ? `${h}h ${min}m` : `${h}h`) : `${min}m`
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  const total = payload[0].payload.__total
  const pct = total ? Math.round((item.value / total) * 100) : 0
  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-0.5">{item.name}</p>
      <p className="text-muted-foreground">
        {formatMinutes(item.value)} · {pct}%
      </p>
    </div>
  )
}

interface DistributionChartProps {
  selectedCategory: string | null
  onSelectCategory: (name: string | null) => void
}

export function DistributionChart({ selectedCategory, onSelectCategory }: DistributionChartProps) {
  const data = selectedCategory ? (SUBCATEGORY_DATA[selectedCategory] ?? []) : CATEGORY_DATA

  const total = data.reduce((s, d) => s + d.value, 0)
  const dataWithTotal = data.map((d) => ({ ...d, __total: total }))

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              onClick={(data: any) => {
                if (!selectedCategory) onSelectCategory(data.name)
              }}
              style={{ cursor: selectedCategory ? 'default' : 'pointer' }}
            >
              {dataWithTotal.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-sm font-semibold text-foreground">{formatMinutes(total)}</p>
          <p className="text-[10px] text-muted-foreground/60">total</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-w-0 flex-1">
        {data.map((item) => {
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
              <span className="flex-1 text-xs text-foreground truncate group-hover:text-foreground transition-colors">
                {item.name}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatMinutes(item.value)}
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
