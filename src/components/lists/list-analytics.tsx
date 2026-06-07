'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  BarChart2,
  TrendingUp,
  CheckCircle2,
  Tag,
  Calendar,
  Trophy,
} from 'lucide-react'
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
const MIN_OFFSET: Record<Period, number> = { day: -90, week: -13, month: -3 }

function DonutChart({ data, total }: { data: ListAnalyticsData['donut']; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/40">
        <div className="h-32 w-32 rounded-full border-4 border-dashed border-border/30" />
        <p className="text-xs mt-4">No completed tasks this week</p>
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
            strokeWidth={strokeWidth}
            className="stroke-muted/40"
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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-background px-3 py-2.5 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="font-semibold text-foreground ml-auto pl-4">{entry.value}</span>
        </div>
      ))}
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
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, className: 'fill-muted-foreground' }}
          tickLine={false}
          axisLine={false}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
        <Legend
          wrapperStyle={{
            fontSize: '11px',
            paddingTop: '12px',
            color: 'hsl(var(--muted-foreground))',
          }}
        />
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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
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

  const navigate = useCallback(
    (dir: 'prev' | 'next') => {
      setOffset((o) => {
        const next = o + (dir === 'prev' ? -1 : 1)
        return Math.max(MIN_OFFSET[period], Math.min(0, next))
      })
    },
    [period],
  )

  const getPeriodLabel = () => {
    if (!data.periodStart) return ''
    const start = new Date(data.periodStart)
    const end = new Date(data.periodEnd)
    if (period === 'day') return format(start, 'EEEE, MMMM d, yyyy')
    if (period === 'week') return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    return format(start, 'MMMM yyyy')
  }

  const topTag = data.donut[0] ?? null
  const uniqueTags = data.donut.length
  const avgPerDay =
    data.series.length > 0 ? Math.round((data.totalCompleted / data.series.length) * 10) / 10 : 0
  const bestDay = data.series.reduce<{ label: string; total: number } | null>((best, p) => {
    if (p.total > (best?.total ?? 0)) return { label: p.label, total: p.total }
    return best
  }, null)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
          Lists
        </p>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Tasks completed by tag and over time</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Completed (7d)"
          value={data.totalCompleted}
          sub="rolling window"
          color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Tag}
          label="Tags active"
          value={uniqueTags}
          sub={topTag ? `Top: ${topTag.label}` : undefined}
          color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg per day"
          value={avgPerDay}
          sub="this period"
          color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Trophy}
          label="Best day"
          value={bestDay?.total ?? 0}
          sub={bestDay ? bestDay.label : 'No data yet'}
          color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Completion by tag</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Last 7 days rolling</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold text-foreground">{data.totalCompleted}</span>
            <span className="text-muted-foreground text-xs">tasks</span>
          </div>
        </div>
        <DonutChart data={data.donut} total={data.totalCompleted} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
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

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate('prev')}
              disabled={offset <= MIN_OFFSET[period]}
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

      {data.donut.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Tag breakdown</h2>
          <div className="space-y-3">
            {data.donut.map((item) => {
              const pct =
                data.totalCompleted > 0 ? Math.round((item.count / data.totalCompleted) * 100) : 0
              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                      <span className="text-sm font-semibold text-foreground w-6 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
