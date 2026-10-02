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
  type NumberFieldAnalytics,
  type BooleanFieldAnalytics,
  type TextFieldAnalytics,
  type ListFieldAnalytics,
  type HabitTrackingAnalyticsResult,
} from '@/api/habits-analytics/actions'
import { AnalyticsPlanNotice } from '@/components/ui/analytics-plan-notice'

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

function NumberFieldChart({ field, color }: { field: NumberFieldAnalytics; color: string }) {
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

const AXIS_TICK = { fontSize: 10, fill: 'currentColor', opacity: 0.45 }

// Distinct, readable colors for the options of a list field.
const OPTION_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
]
const optionColor = (i: number) => OPTION_COLORS[i % OPTION_COLORS.length]

function FieldCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
      <div className="px-5 py-3 border-b border-border/40">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  )
}

function EmptyField() {
  return (
    <div className="flex h-32 items-center justify-center">
      <p className="text-xs text-muted-foreground/50">No data for this period</p>
    </div>
  )
}

// Yes/No field: share of "yes" answers per day (or month), 0–100 %.
function BooleanFieldChart({ field, color }: { field: BooleanFieldAnalytics; color: string }) {
  const hasData = field.yes + field.no > 0
  return (
    <FieldCard
      title={field.fieldLabel}
      subtitle={
        hasData ? `Yes ${field.rate}% of the time · ${field.yes} yes · ${field.no} no` : undefined
      }
    >
      {!hasData ? (
        <EmptyField />
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={field.points} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.06}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              cursor={{ fill: `${color}10` }}
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload
                return (
                  <div className="rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-md text-xs">
                    <p className="text-muted-foreground mb-0.5">{label}</p>
                    {p.rate === null ? (
                      <p className="text-muted-foreground">No answer</p>
                    ) : (
                      <p className="font-semibold" style={{ color }}>
                        {p.rate}% yes ({p.yes}/{p.yes + p.no})
                      </p>
                    )}
                  </div>
                )
              }}
            />
            <Bar dataKey="rate" fill={color} opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </FieldCard>
  )
}

function formatEntryDate(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Free text: the most frequent answers, or a journal of the latest ones when
// they're mostly all different.
function TextFieldCard({ field, color }: { field: TextFieldAnalytics; color: string }) {
  const max = field.topValues[0]?.count ?? 0
  return (
    <FieldCard
      title={field.fieldLabel}
      subtitle={
        field.filled > 0
          ? `${field.filled} answer${field.filled > 1 ? 's' : ''}${
              field.mode === 'top' ? ` · ${field.distinct} different` : ''
            }`
          : undefined
      }
    >
      {field.filled === 0 ? (
        <EmptyField />
      ) : field.mode === 'top' ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {field.topValues.map((v) => (
              <div key={v.value} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 truncate text-foreground" title={v.value}>
                  {v.value}
                </span>
                <div className="h-2 flex-1 rounded-full bg-muted/50">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(v.count / max) * 100}%`,
                      backgroundColor: color,
                      opacity: 0.85,
                    }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                  {v.count}
                </span>
              </div>
            ))}
            {field.otherCount > 0 && (
              <p className="text-[11px] text-muted-foreground/70">
                + {field.otherCount} other answer{field.otherCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <TextEntries entries={field.entries.slice(0, 5)} title="Latest" />
        </div>
      ) : (
        <TextEntries entries={field.entries} />
      )}
    </FieldCard>
  )
}

function TextEntries({
  entries,
  title,
}: {
  entries: TextFieldAnalytics['entries']
  title?: string
}) {
  return (
    <div className="space-y-1.5">
      {title && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
          {title}
        </p>
      )}
      <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
        {entries.map((e, i) => (
          <li key={`${e.dateKey}-${i}`} className="flex gap-3 text-xs">
            <span className="w-12 shrink-0 text-muted-foreground/70 tabular-nums">
              {formatEntryDate(e.dateKey)}
            </span>
            <span className="min-w-0 flex-1 break-words text-foreground">{e.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// List field: how often each option was picked, stacked per day (or month).
function ListFieldChart({ field }: { field: ListFieldAnalytics }) {
  // Recharts needs flat keys: option i is stored as `o<i>` (any option name
  // is then safe, even "label" or "total").
  const data = field.points.map((p) => ({
    label: p.label,
    ...Object.fromEntries(field.options.map((o, i) => [`o${i}`, p.counts[o.value] ?? 0])),
  }))
  const max = Math.max(0, ...field.points.map((p) => p.total))
  const [yMin, yMax] = niceAxisDomain(max)
  return (
    <FieldCard
      title={field.fieldLabel}
      subtitle={field.total > 0 ? `${field.total} answer${field.total > 1 ? 's' : ''}` : undefined}
    >
      {field.total === 0 ? (
        <EmptyField />
      ) : (
        <div className="space-y-3">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                opacity={0.06}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[yMin, yMax]}
                allowDecimals={false}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: 'currentColor', fillOpacity: 0.04 }}
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null
                  const rows = payload.filter((p: any) => p.value > 0)
                  return (
                    <div className="rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-md text-xs">
                      <p className="text-muted-foreground mb-1">{label}</p>
                      {rows.length === 0 ? (
                        <p className="text-muted-foreground">No answer</p>
                      ) : (
                        rows.map((p: any) => (
                          <p key={p.dataKey} className="font-medium" style={{ color: p.fill }}>
                            {p.name}: {p.value}
                          </p>
                        ))
                      )}
                    </div>
                  )
                }}
              />
              {field.options.map((o, i) => (
                <Bar
                  key={o.value}
                  dataKey={`o${i}`}
                  name={o.value}
                  stackId="options"
                  fill={optionColor(i)}
                  opacity={0.85}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {field.options.map((o, i) => (
              <span
                key={o.value}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: optionColor(i) }}
                />
                <span className="text-foreground">{o.value}</span>
                <span className="tabular-nums">
                  {o.count} ({field.total > 0 ? Math.round((o.count / field.total) * 100) : 0}%)
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </FieldCard>
  )
}

function FieldChart({ field, color }: { field: TrackingFieldAnalytics; color: string }) {
  switch (field.fieldType) {
    case 'boolean':
      return <BooleanFieldChart field={field} color={color} />
    case 'text':
      return <TextFieldCard field={field} color={color} />
    case 'list':
      return <ListFieldChart field={field} />
    default:
      return <NumberFieldChart field={field} color={color} />
  }
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
        {data.restrictedByPlan && <AnalyticsPlanNotice />}
        {data.fields.map((field) => (
          <FieldChart key={field.fieldKey} field={field} color={color} />
        ))}
      </div>
    </div>
  )
}
