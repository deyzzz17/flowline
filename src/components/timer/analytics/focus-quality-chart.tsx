'use client'

import { startTransition, useState } from 'react'
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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from './empty-state'
import { ChartTypeToggle, type ChartType } from './chart-type-toggle'
import { TimePeriodSelector, type TimePeriod } from './time-period-selector'
import { cn } from '@/lib/utils'
import { getTimerAnalytics, type SessionAnalytics } from '@/api/timer-analytics/actions'

function hexToRgba(hex: string, alpha: number) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(139,92,246,${alpha})`
  }
}

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
              style={{ backgroundColor: p.fill ?? p.stroke ?? '#8b5cf6' }}
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
  initialData: SessionAnalytics
  initialPeriod: TimePeriod
}

export function FocusQualityChart({ initialData, initialPeriod }: FocusQualityChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [view, setView] = useState<FocusView>('category')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod)
  const [offset, setOffset] = useState(0)
  const [analyticsData, setAnalyticsData] = useState<SessionAnalytics>(initialData)
  const [selectedKeys, setSelectedKeys] = useState<Set<string> | null>(null)
  const [isPending, setIsPending] = useState(false)

  const fetchData = (p: TimePeriod, o: number) => {
    setIsPending(true)
    startTransition(async () => {
      const fresh = await getTimerAnalytics(p, o)
      setAnalyticsData(fresh)
      setIsPending(false)
    })
  }

  const handlePeriodChange = (p: TimePeriod) => {
    setPeriod(p)
    setOffset(0)
    fetchData(p, 0)
  }

  const handleNavigate = (dir: 'prev' | 'next') => {
    const newOffset = offset + (dir === 'prev' ? -1 : 1)
    setOffset(newOffset)
    fetchData(period, newOffset)
  }

  const currentByCategory: FocusDataPoint[] = analyticsData.focusQuality.byCategory ?? []
  const currentBySubcategory: (FocusDataPoint & { parentCategory: string })[] =
    (analyticsData.focusQuality as any).bySubcategory ?? []

  const categoryItems: FocusDataPoint[] = [
    {
      name: 'Global',
      avgRating: analyticsData.focusQuality.global.avgRating,
      sessions: analyticsData.focusQuality.global.sessions,
      color: '#8b5cf6',
    },
    ...currentByCategory,
  ]

  const availableCategories = [...new Set(currentBySubcategory.map((s) => s.parentCategory))]
  const filteredSubs =
    selectedCategory === 'All'
      ? currentBySubcategory
      : currentBySubcategory.filter((s) => s.parentCategory === selectedCategory)

  const currentItems = view === 'category' ? categoryItems : filteredSubs

  const focusCatTimeSeries = (analyticsData as any).focusQualityTimeSeries ?? []
  const focusCatSeriesDefs = (analyticsData as any).focusQualitySeriesDefinitions ?? []
  const focusSubTimeSeries = (analyticsData as any).focusQualitySubTimeSeries ?? []
  const focusSubSeriesDefs = (analyticsData as any).focusQualitySubSeriesDefinitions ?? []

  const activeTimeSeries = view === 'category' ? focusCatTimeSeries : focusSubTimeSeries
  const activeSeriesDefs =
    view === 'category'
      ? focusCatSeriesDefs
      : focusSubSeriesDefs.filter(
          (s: any) => selectedCategory === 'All' || s.parentCategory === selectedCategory,
        )

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      if (prev === null) return new Set([key])
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        if (next.size === 0) return null
      } else next.add(key)
      return next
    })
  }

  const hasTimeSeries = activeTimeSeries.length > 0 && activeSeriesDefs.length > 0
  const visibleSeriesDefs = activeSeriesDefs.filter(
    (s: any) => selectedKeys === null || selectedKeys.has(s.key),
  )

  const barData = currentItems
    .filter((item) => {
      if (selectedKeys === null) return true
      const key =
        view === 'category'
          ? `rating__${item.name}`
          : `rating_sub__${(item as any).parentCategory}::${item.name}`
      return selectedKeys.has(key) || item.name === 'Global'
    })
    .map((item) => ({
      name: item.name,
      avgRating: item.avgRating,
      sessions: item.sessions,
      color: item.color,
    }))

  const selectorItems = hasTimeSeries
    ? activeSeriesDefs
    : currentItems.map((item) => ({
        key:
          view === 'category'
            ? `rating__${item.name}`
            : `rating_sub__${(item as any).parentCategory}::${item.name}`,
        name: item.name,
        color: item.color,
      }))

  const hasRatedSessions = analyticsData.focusQuality.global.sessions > 0

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
            {(['category', 'subcategory'] as FocusView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setView(v)
                  setSelectedKeys(null)
                }}
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

          <div className="flex items-center gap-2 flex-wrap">
            <TimePeriodSelector value={period} onChange={handlePeriodChange} />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleNavigate('prev')}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span
                className={cn(
                  'text-xs font-medium text-foreground min-w-24 text-center transition-opacity',
                  isPending && 'opacity-40',
                )}
              >
                {analyticsData.periodLabel}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleNavigate('next')}
                disabled={offset >= 0}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <ChartTypeToggle value={chartType} onChange={setChartType} />
          </div>
        </div>

        {view === 'subcategory' && availableCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {['All', ...availableCategories].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat)
                  setSelectedKeys(null)
                }}
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

        {hasRatedSessions && selectorItems.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {selectorItems.map((s: any) => {
              const isActive = selectedKeys === null || selectedKeys.has(s.key)
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleKey(s.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                    isActive ? '' : 'border-border/40 bg-background text-muted-foreground/40',
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: hexToRgba(s.color, 0.12),
                          borderColor: hexToRgba(s.color, 0.4),
                          color: s.color,
                        }
                      : undefined
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: isActive ? s.color : 'currentColor',
                      opacity: isActive ? 1 : 0.4,
                    }}
                  />
                  {s.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {!hasRatedSessions ? (
        <EmptyState message="No rated sessions for this period." />
      ) : currentItems.length === 0 ? (
        <EmptyState
          message={
            view === 'subcategory'
              ? 'No rated sessions with sub-categories yet.'
              : 'Rate sessions to see insights.'
          }
        />
      ) : (
        <div className={cn('transition-opacity', isPending && 'opacity-40')}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart
              data={hasTimeSeries ? activeTimeSeries : barData}
              margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.5 0.01 286 / 0.08)"
                vertical={false}
              />
              <XAxis
                dataKey={hasTimeSeries ? 'label' : 'name'}
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

              {chartType === 'bar'
                ? (hasTimeSeries
                    ? visibleSeriesDefs
                    : barData.map((d) => ({
                        key: view === 'category' ? `rating__${d.name}` : `rating_sub__${d.name}`,
                        name: d.name,
                        color: d.color,
                      }))
                  ).map((s: any) => (
                    <Bar
                      key={s.key}
                      dataKey={hasTimeSeries ? s.key : 'avgRating'}
                      name={s.name}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                      shape={(props: any) => {
                        const { x, y, width, height } = props
                        if (!height || height <= 0) return <g />
                        return (
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={s.color}
                            fillOpacity={0.85}
                            rx={4}
                            ry={4}
                          />
                        )
                      }}
                    />
                  ))
                : visibleSeriesDefs.map((s: any) => (
                    <Line
                      key={s.key}
                      dataKey={s.key}
                      name={s.name}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={{ fill: s.color, strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: s.color, strokeWidth: 0 }}
                      connectNulls={false}
                      type="monotone"
                    />
                  ))}
            </ComposedChart>
          </ResponsiveContainer>

          <div className="rounded-xl border border-border/50 overflow-hidden mt-4">
            <div className="grid grid-cols-4 border-b border-border/40 px-4 py-2 bg-muted/20">
              {[
                view === 'category' ? 'Category' : 'Sub-category',
                'Avg rating',
                'Sessions',
                '',
              ].map((h, i) => (
                <p
                  key={i}
                  className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60"
                >
                  {h}
                </p>
              ))}
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
      )}
    </div>
  )
}
