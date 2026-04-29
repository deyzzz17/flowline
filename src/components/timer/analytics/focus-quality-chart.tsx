'use client'

import { useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { EmptyState } from './empty-state'
import { ChartTypeToggle, type ChartType } from './chart-type-toggle'
import { cn } from '@/lib/utils'

interface FocusDataPoint {
  name: string
  color: string
  avgRating: number
  sessions: number
  parentCategory?: string
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
              style={{ backgroundColor: p.color ?? p.stroke }}
            />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-medium text-foreground tabular-nums">
            {(p.value as number).toFixed(1)} ★
          </span>
        </div>
      ))}
    </div>
  )
}

type FocusView = 'category' | 'subcategory'

interface FocusQualityChartProps {
  global: { avgRating: number; sessions: number }
  byCategory: FocusDataPoint[]
  bySubcategory: (FocusDataPoint & { parentCategory: string })[]
}

export function FocusQualityChart({
  global: globalData,
  byCategory,
  bySubcategory,
}: FocusQualityChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [view, setView] = useState<FocusView>('category')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  if (globalData.sessions === 0) {
    return <EmptyState message="Rate your sessions to see focus quality insights." />
  }

  const categoryItems: FocusDataPoint[] = [
    {
      name: 'Global',
      avgRating: globalData.avgRating,
      sessions: globalData.sessions,
      color: '#8b5cf6',
    },
    ...byCategory,
  ]

  const availableCategories = [...new Set(bySubcategory.map((s) => s.parentCategory))]
  const filteredSubs =
    selectedCategory === 'All'
      ? bySubcategory
      : bySubcategory.filter((s) => s.parentCategory === selectedCategory)

  const currentItems = view === 'category' ? categoryItems : filteredSubs

  if (currentItems.length === 0) {
    return (
      <div className="space-y-4">
        <FocusControls
          view={view}
          setView={setView}
          chartType={chartType}
          setChartType={setChartType}
          availableCategories={availableCategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        <EmptyState
          message={
            view === 'subcategory'
              ? 'No rated sessions with sub-categories yet.'
              : 'Rate sessions to see insights.'
          }
        />
      </div>
    )
  }

  const barData = currentItems.map((item) => ({
    name: item.name,
    avgRating: item.avgRating,
    sessions: item.sessions,
    color: item.color,
  }))

  return (
    <div className="space-y-4">
      <FocusControls
        view={view}
        setView={setView}
        chartType={chartType}
        setChartType={setChartType}
        availableCategories={view === 'subcategory' ? availableCategories : []}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={barData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.5 0.01 286 / 0.08)"
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
          <Tooltip content={<CustomTooltip />} cursor={false} />

          {chartType === 'bar' ? (
            <Bar
              dataKey="avgRating"
              name="Avg rating"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
              shape={(props: any) => {
                const { x, y, width, height, index } = props
                const color = barData[index]?.color ?? '#8b5cf6'
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
          ) : (
            currentItems.map((item) => (
              <Line
                key={item.name}
                data={[{ name: item.name, value: item.avgRating }]}
                dataKey="value"
                name={item.name}
                stroke={item.color}
                strokeWidth={2.5}
                dot={{ fill: item.color, strokeWidth: 0, r: 5 }}
                activeDot={{ r: 7, fill: item.color, strokeWidth: 0 }}
                type="monotone"
              />
            ))
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="grid grid-cols-4 border-b border-border/40 px-4 py-2 bg-muted/20">
          {[view === 'category' ? 'Category' : 'Sub-category', 'Avg rating', 'Sessions', ''].map(
            (h, i) => (
              <p
                key={i}
                className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60"
              >
                {h}
              </p>
            ),
          )}
        </div>
        <div className="divide-y divide-border/30">
          {currentItems.map((d) => (
            <div
              key={d.name}
              className="grid grid-cols-4 px-4 py-2.5 items-center hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-xs font-medium text-foreground truncate">{d.name}</span>
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

function FocusControls({
  view,
  setView,
  chartType,
  setChartType,
  availableCategories,
  selectedCategory,
  setSelectedCategory,
}: {
  view: FocusView
  setView: (v: FocusView) => void
  chartType: ChartType
  setChartType: (v: ChartType) => void
  availableCategories: string[]
  selectedCategory: string
  setSelectedCategory: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
          {(['category', 'subcategory'] as FocusView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
                view === v
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v === 'category' ? 'By category' : 'By sub-category'}
            </button>
          ))}
        </div>
        <ChartTypeToggle value={chartType} onChange={setChartType} />
      </div>

      {view === 'subcategory' && availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {['All', ...availableCategories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
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
      )}
    </div>
  )
}
