'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, BarChart2 as BarIcon, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  getHabitTrackingAnalytics,
  type TrackingPeriod,
  type TrackingFieldAnalytics,
  type HabitTrackingAnalyticsResult,
} from '@/api/habits-analytics/actions'

const PERIODS: { value: TrackingPeriod; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

function PeriodSelector({
  value,
  onChange,
}: {
  value: TrackingPeriod
  onChange: (v: TrackingPeriod) => void
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
            value === p.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

function CustomTooltip({ active, payload, label, color }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold" style={{ color }}>
        {payload[0].value}
      </p>
    </div>
  )
}

function niceAxisDomain(max: number): [number, number] {
  if (max === 0) return [0, 10]
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
  const niceFactor = max / magnitude <= 2 ? 2 : max / magnitude <= 5 ? 5 : 10
  const niceMax = Math.ceil(max / ((magnitude * niceFactor) / 10)) * ((magnitude * niceFactor) / 10)
  return [0, niceMax]
}

function FieldChart({ field, color }: { field: TrackingFieldAnalytics; color: string }) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')
  const hasData = field.points.some((p) => p.value > 0)
  const [yMin, yMax] = niceAxisDomain(field.max)
  const tickCount = 5
  const tickStep = yMax / (tickCount - 1)
  const yTicks = Array.from({ length: tickCount }, (_, i) => Math.round(i * tickStep))
  const unit = field.fieldKey === 'duration' ? ' min' : ''

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div>
          <p className="text-sm font-semibold text-foreground">{field.fieldLabel}</p>
          {hasData && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Total: {field.total}
              {unit} · Avg: {field.avg}
              {unit} · Max: {field.max}
              {unit}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md transition-all',
              chartType === 'bar'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <BarIcon className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md transition-all',
              chartType === 'line'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <TrendingUp className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="px-4 py-4">
        {!hasData ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-xs text-muted-foreground/50">No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            {chartType === 'bar' ? (
              <BarChart data={field.points} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  opacity={0.06}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.45 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[yMin, yMax]}
                  ticks={yTicks}
                  tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.45 }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  content={<CustomTooltip color={color} />}
                  cursor={{ fill: `${color}10` }}
                />
                <Bar
                  dataKey="value"
                  fill={color}
                  opacity={0.85}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            ) : (
              <LineChart data={field.points} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  opacity={0.06}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.45 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[yMin, yMax]}
                  ticks={yTicks}
                  tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.45 }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip color={color} />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    if (payload.value === 0) return <g key={props.key} />
                    return <circle key={props.key} cx={cx} cy={cy} r={3} fill={color} />
                  }}
                  activeDot={{ r: 5, fill: color }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

interface HabitTrackingChartsProps {
  habitId: number
  color: string
  data: HabitTrackingAnalyticsResult
  onDataChange: (data: HabitTrackingAnalyticsResult) => void
}

export function HabitTrackingCharts({
  habitId,
  color,
  data,
  onDataChange,
}: HabitTrackingChartsProps) {
  const [period, setPeriod] = useState<TrackingPeriod>('week')
  const [offset, setOffset] = useState(0)
  const [isPending, startTransition] = useTransition()

  const fetchData = (p: TrackingPeriod, o: number) => {
    startTransition(async () => {
      const fresh = await getHabitTrackingAnalytics(habitId, p, o)
      onDataChange(fresh)
    })
  }

  const handlePeriodChange = (p: TrackingPeriod) => {
    setPeriod(p)
    setOffset(0)
    fetchData(p, 0)
  }

  const handleNavigate = (dir: 'prev' | 'next') => {
    const newOffset = offset + (dir === 'prev' ? -1 : 1)
    setOffset(newOffset)
    fetchData(period, newOffset)
  }

  if (data.fields.length === 0 && !isPending) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
          <p className="text-sm font-semibold text-foreground">Tracking analytics</p>
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodSelector value={period} onChange={handlePeriodChange} />
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
                'text-xs font-medium text-foreground min-w-28 text-center transition-opacity',
                isPending && 'opacity-40',
              )}
            >
              {data.periodLabel}
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
        </div>
      </div>
      <div className={cn('space-y-4 transition-opacity', isPending && 'opacity-40')}>
        {data.fields.map((field) => (
          <FieldChart key={field.fieldKey} field={field} color={color} />
        ))}
      </div>
    </div>
  )
}
