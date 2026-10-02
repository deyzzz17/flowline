'use client'

import { useState, useTransition } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  BarChart2 as BarIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from 'lucide-react'
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
  type TableFieldAnalytics,
  type TableNumberStats,
  type HabitTrackingAnalyticsResult,
} from '@/api/habits-analytics/actions'
import { AnalyticsPlanNotice } from '@/components/ui/analytics-plan-notice'
import { formatTableCell } from '@/lib/tracking-fields'

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

// Distinct, readable colors for the series of a list (table) field.
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

type Aggregation = 'sum' | 'max' | 'avg'

const AGGREGATIONS: { value: Aggregation; label: string }[] = [
  { value: 'sum', label: 'Total' },
  { value: 'max', label: 'Best' },
  { value: 'avg', label: 'Average' },
]

const CHART_MAX_SERIES = 6

function aggregate(stats: TableNumberStats | null | undefined, agg: Aggregation): number | null {
  if (!stats || stats.count === 0) return null
  if (agg === 'max') return stats.max
  if (agg === 'avg') return Math.round((stats.sum / stats.count) * 10) / 10
  return stats.sum
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2 py-1 text-[11px] font-medium transition-all',
            value === o.value
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Trend({ last, previous }: { last: number | null; previous: number | null }) {
  if (last === null || previous === null) return null
  if (last > previous) return <TrendingUp className="h-3 w-3 text-emerald-500" aria-label="Up" />
  if (last < previous) return <TrendingDown className="h-3 w-3 text-rose-500" aria-label="Down" />
  return <Minus className="h-3 w-3 text-muted-foreground/60" aria-label="Same" />
}

// List (table) field — adapts to its columns:
// - number columns: evolution per group (or overall) with Total / Best / Average,
//   and a per-group summary with record, latest session and trend;
// - no number column: how many rows per group over time;
// - choice / yes-no / text columns: how they were answered;
// - the latest sessions as tables.
function TableFieldCard({ field }: { field: TableFieldAnalytics }) {
  const numberColumns = field.columns.filter((c) => c.type === 'number')
  const [metricKey, setMetricKey] = useState<string>(numberColumns[0]?.key ?? '#')
  const [agg, setAgg] = useState<Aggregation>('sum')
  const [groupFilter, setGroupFilter] = useState<string>('__chart_all__')
  const [historyOpen, setHistoryOpen] = useState(false)

  const metric = numberColumns.find((c) => c.key === metricKey)
  const isCount = !metric
  const unit = metric?.unit ? ` ${metric.unit}` : ''
  const hasGroups = field.groupBy !== null

  const chartGroups = (
    groupFilter === '__chart_all__'
      ? field.groups.slice(0, CHART_MAX_SERIES)
      : field.groups.filter((g) => g.key === groupFilter)
  ).map((g, i) => ({
    ...g,
    color: optionColor(field.groups.indexOf(g) >= 0 ? field.groups.indexOf(g) : i),
  }))

  const data = field.points.map((p) => ({
    label: p.label,
    ...Object.fromEntries(
      chartGroups.map((g, i) => [
        `s${i}`,
        isCount
          ? (p.stats[`${g.key}|#`]?.count ?? null)
          : aggregate(p.stats[`${g.key}|${metricKey}`], agg),
      ]),
    ),
  }))
  const hasChartData = data.some((d) =>
    chartGroups.some((_, i) => d[`s${i}` as keyof typeof d] !== null),
  )

  const groupColumn = field.columns.find((c) => c.key === field.groupBy)
  const columnByKey = new Map(field.columns.map((c) => [c.key, c]))
  const history = historyOpen ? field.history : field.history.slice(0, 3)

  return (
    <FieldCard
      title={field.fieldLabel}
      subtitle={
        field.sessions > 0
          ? `${field.sessions} session${field.sessions > 1 ? 's' : ''} · ${field.rows} row${field.rows > 1 ? 's' : ''}${
              hasGroups
                ? ` · ${field.groups.length} ${groupColumn?.label.toLowerCase() ?? 'group'}${field.groups.length > 1 ? 's' : ''}`
                : ''
            }`
          : undefined
      }
    >
      {field.sessions === 0 ? (
        <EmptyField />
      ) : (
        <div className="space-y-5">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {numberColumns.length > 0 && (
              <Segmented
                value={metricKey}
                onChange={setMetricKey}
                options={[
                  ...numberColumns.map((c) => ({ value: c.key, label: c.label })),
                  { value: '#', label: 'Rows' },
                ]}
              />
            )}
            {!isCount && <Segmented value={agg} onChange={setAgg} options={AGGREGATIONS} />}
            {hasGroups && field.groups.length > 1 && (
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="h-7 rounded-lg border border-border/50 bg-background px-2 text-[11px] text-foreground outline-none"
                aria-label={`Filter by ${groupColumn?.label ?? 'group'}`}
              >
                <option value="__chart_all__">
                  {field.groups.length > CHART_MAX_SERIES
                    ? `Top ${CHART_MAX_SERIES} ${groupColumn?.label.toLowerCase() ?? 'groups'}`
                    : `All ${groupColumn?.label.toLowerCase() ?? 'groups'}`}
                </option>
                {field.groups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Evolution */}
          {!hasChartData ? (
            <EmptyField />
          ) : (
            <div className="space-y-2">
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
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
                    allowDecimals={!isCount}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload?.length) return null
                      const rows = payload.filter(
                        (p: any) => p.value !== null && p.value !== undefined,
                      )
                      if (rows.length === 0) return null
                      return (
                        <div className="rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-md text-xs">
                          <p className="text-muted-foreground mb-1">{label}</p>
                          {rows.map((p: any) => (
                            <p key={p.dataKey} className="font-medium" style={{ color: p.stroke }}>
                              {p.name}: {p.value}
                              {isCount ? '' : unit}
                            </p>
                          ))}
                        </div>
                      )
                    }}
                  />
                  {chartGroups.map((g, i) => (
                    <Line
                      key={g.key}
                      type="monotone"
                      dataKey={`s${i}`}
                      name={g.label}
                      stroke={g.color}
                      strokeWidth={2}
                      connectNulls
                      dot={{ r: 2.5, fill: g.color }}
                      activeDot={{ r: 4.5, fill: g.color }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              {chartGroups.length > 1 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {chartGroups.map((g) => (
                    <span
                      key={g.key}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                      {g.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Per group summary */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
              {hasGroups ? `By ${groupColumn?.label.toLowerCase() ?? 'group'}` : 'Summary'}
            </p>
            <div className="overflow-hidden rounded-xl border border-border/40">
              <table className="w-full table-fixed text-xs">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="w-[34%] px-2.5 py-1.5 text-left font-medium">
                      {hasGroups ? (groupColumn?.label ?? 'Group') : ''}
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium">Sessions</th>
                    {metric ? (
                      <>
                        <th className="px-2 py-1.5 text-right font-medium">Total</th>
                        <th className="px-2 py-1.5 text-right font-medium">Best</th>
                        <th className="px-2 py-1.5 text-right font-medium">Last</th>
                      </>
                    ) : (
                      <th className="px-2 py-1.5 text-right font-medium">Rows</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {field.groups.map((g) => {
                    const c = metric ? g.columns[metric.key] : undefined
                    const last = c ? aggregate(c.last, agg) : null
                    const previous = c ? aggregate(c.previous, agg) : null
                    return (
                      <tr key={g.key} className="border-t border-border/30">
                        <td
                          className="truncate px-2.5 py-1.5 font-medium text-foreground"
                          title={g.label}
                        >
                          <span
                            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                            style={{ backgroundColor: optionColor(field.groups.indexOf(g)) }}
                          />
                          {hasGroups ? g.label : field.fieldLabel}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                          {g.sessions}
                        </td>
                        {metric && c ? (
                          <>
                            <td className="px-2 py-1.5 text-right tabular-nums text-foreground">
                              {c.period.count > 0 ? `${c.period.sum}${unit}` : '—'}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-foreground">
                              {c.period.count > 0 ? `${c.period.max}${unit}` : '—'}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-foreground">
                              <span className="inline-flex items-center justify-end gap-1">
                                {last !== null ? `${last}${unit}` : '—'}
                                <Trend last={last} previous={previous} />
                              </span>
                            </td>
                          </>
                        ) : (
                          <td className="px-2 py-1.5 text-right tabular-nums text-foreground">
                            {g.rows}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {metric && (
              <p className="text-[10px] text-muted-foreground/60">
                Best = highest single row. Last = latest session (
                {AGGREGATIONS.find((a) => a.value === agg)?.label.toLowerCase()}), compared with the
                one before.
              </p>
            )}
          </div>

          {/* How the other columns were answered */}
          {field.distributions.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {field.distributions.map((d) => {
                const col = columnByKey.get(d.columnKey)
                const max = Math.max(1, ...d.values.map((v) => v.count))
                return (
                  <div key={d.columnKey} className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                      {col?.label}
                    </p>
                    {d.values.map((v, i) => (
                      <div key={v.value} className="flex items-center gap-2 text-xs">
                        <span className="w-24 shrink-0 truncate text-foreground" title={v.value}>
                          {v.value}
                        </span>
                        <div className="h-2 flex-1 rounded-full bg-muted/50">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(v.count / max) * 100}%`,
                              backgroundColor: optionColor(i),
                              opacity: 0.85,
                            }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                          {v.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Latest sessions */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
              Sessions
            </p>
            {history.map((session, si) => (
              <div key={`${session.dateKey}-${si}`} className="space-y-1">
                <p className="text-xs font-medium text-foreground">
                  {formatEntryDate(session.dateKey)}
                </p>
                <div className="overflow-x-auto rounded-xl border border-border/40">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 text-muted-foreground">
                      <tr>
                        {field.columns.map((c) => (
                          <th
                            key={c.key}
                            className="whitespace-nowrap px-2.5 py-1 text-left font-medium"
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {session.rows.map((row, ri) => (
                        <tr key={ri} className="border-t border-border/30">
                          {field.columns.map((c) => (
                            <td
                              key={c.key}
                              className="whitespace-nowrap px-2.5 py-1 text-foreground"
                            >
                              {formatTableCell(c, row[c.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {field.history.length > 3 && (
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                {historyOpen ? 'Show less' : `Show all ${field.history.length} sessions`}
              </button>
            )}
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
      return <TableFieldCard field={field} />
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
