'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, BarChart2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { getListAnalytics, type ListAnalyticsData } from '@/api/list-analytics/actions'
import { format } from 'date-fns'

type Period = 'day' | 'week' | 'month'
type ChartType = 'bar' | 'line'

const PERIOD_LABELS: Record<Period, string> = { day: 'Day', week: 'Week', month: 'Month' }

function DonutChart({ data, total }: { data: ListAnalyticsData['donut']; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/40">
        <div className="h-32 w-32 rounded-full border-4 border-dashed border-border/30" />
        <p className="text-xs mt-4">No completed tasks</p>
      </div>
    )
  }

  const size = 160
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  let cumulativePercent = 0
  const segments = data.map((item) => {
    const percent = total > 0 ? item.count / total : 0
    const offset = circumference * (1 - cumulativePercent)
    const dash = circumference * percent
    cumulativePercent += percent
    return { ...item, percent, offset, dash }
  })

  const hoveredItem = hovered ? data.find((d) => d.id === hovered) : null

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {segments.map((seg) => (
            <circle
              key={seg.id}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === seg.id ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-width 150ms' }}
              onMouseEnter={() => setHovered(seg.id)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hoveredItem ? (
            <>
              <p className="text-xl font-bold text-foreground">{hoveredItem.count}</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-20 text-center">
                {hoveredItem.label}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground">{total}</p>
              <p className="text-[10px] text-muted-foreground">completed</p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 max-w-xs">
        {data.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-1.5 cursor-pointer transition-opacity',
              hovered && hovered !== item.id && 'opacity-30',
            )}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xs font-semibold text-foreground">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SeriesChart({
  series,
  tags,
  chartType,
}: {
  series: ListAnalyticsData['series']
  tags: ListAnalyticsData['seriesTags']
  chartType: ChartType
}) {
  if (tags.length === 0 || series.every((p) => p.total === 0)) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground/40">
        <p className="text-xs">No data for this period</p>
      </div>
    )
  }

  const chartData = series.map((point) => ({
    name: point.label,
    ...Object.fromEntries(tags.map((t) => [t.id, point.byTag[t.id] ?? 0])),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          cursor={false}
        />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
        {tags.map((tag) =>
          chartType === 'bar' ? (
            <Bar
              key={tag.id}
              dataKey={tag.id}
              name={tag.label}
              fill={tag.color}
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
          ) : (
            <Line
              key={tag.id}
              dataKey={tag.id}
              name={tag.label}
              stroke={tag.color}
              strokeWidth={2}
              dot={false}
            />
          ),
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function ListAnalyticsClient({ initialData }: { initialData: ListAnalyticsData }) {
  const [period, setPeriod] = useState<Period>('week')
  const [offset, setOffset] = useState(0)
  const [chartType, setChartType] = useState<ChartType>('bar')

  const { data = initialData, isFetching } = useQuery({
    queryKey: ['list-analytics', period, offset],
    queryFn: () => getListAnalytics(period, offset),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  })

  const navigate = useCallback((dir: 'prev' | 'next') => {
    setOffset((o) => o + (dir === 'prev' ? -1 : 1))
  }, [])

  const getPeriodLabel = () => {
    if (!data.periodStart) return ''
    const start = new Date(data.periodStart)
    const end = new Date(data.periodEnd)
    if (period === 'day') return format(start, 'EEEE, MMMM d, yyyy')
    if (period === 'week') return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    return format(start, 'MMMM yyyy')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lists Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Tasks completed by tag</p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Last 7 days</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Rolling — recalculated daily</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground text-lg">{data.totalCompleted}</span>
            tasks completed
          </div>
        </div>
        <DonutChart data={data.donut} total={data.totalCompleted} />
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
              {(['day', 'week', 'month'] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPeriod(p)
                    setOffset(0)
                  }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    period === p
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={cn(
                  'rounded-lg p-1.5 transition-all',
                  chartType === 'bar'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <BarChart2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={cn(
                  'rounded-lg p-1.5 transition-all',
                  chartType === 'line'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <TrendingUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span
              className={cn(
                'text-xs font-medium text-foreground min-w-36 text-center transition-opacity',
                isFetching && 'opacity-40',
              )}
            >
              {getPeriodLabel()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate('next')}
              disabled={offset >= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className={cn('transition-opacity', isFetching && 'opacity-40')}>
          <SeriesChart series={data.series} tags={data.seriesTags} chartType={chartType} />
        </div>
      </div>
    </div>
  )
}
