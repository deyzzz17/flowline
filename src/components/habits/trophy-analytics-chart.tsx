'use client'

import { useState, useTransition } from 'react'
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  getGoalTrophyAnalytics,
  type TrophyPeriod,
  type TrophyAnalyticsResult,
} from '@/api/habits-analytics/goal-trophy-analytics-actions'
import { formatDistanceToNow } from 'date-fns'

function niceYAxis(maxVal: number): { domain: [number, number]; ticks: number[] } {
  if (maxVal === 0) return { domain: [0, 4], ticks: [0, 1, 2, 3, 4] }
  const rawStep = maxVal / 4
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  let step: number
  if (normalized <= 1) step = magnitude
  else if (normalized <= 2) step = 2 * magnitude
  else if (normalized <= 5) step = 5 * magnitude
  else step = 10 * magnitude
  const niceMax = Math.ceil(maxVal / step) * step
  const ticks: number[] = []
  for (let i = 0; i <= niceMax / step; i++) ticks.push(i * step)
  return { domain: [0, niceMax], ticks }
}

function formatTooltipLabel(point: any, period: TrophyPeriod): string {
  if (period === 'day') {
    const [, hourPart] = point.dateKey.split('|')
    const h = parseInt(hourPart, 10)
    const hourStart = `${String(h).padStart(2, '0')}:00`
    const hourEnd = `${String(h + 1).padStart(2, '0')}:00`
    return `${hourStart}–${hourEnd}`
  }
  if (period === 'week') {
    const date = new Date(point.dateKey + 'T12:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  if (period === 'month') {
    const date = new Date(point.dateKey + 'T12:00:00')
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  if (period === 'year') {
    const date = new Date(point.dateKey + 'T12:00:00')
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  return point.label
}

const PERIOD_LABELS: Record<TrophyPeriod, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
}

const amber = '#f59e0b'

interface TrophyAnalyticsChartProps {
  initialData: TrophyAnalyticsResult
  initialPeriod?: TrophyPeriod
}

export function TrophyAnalyticsChart({
  initialData,
  initialPeriod = 'month',
}: TrophyAnalyticsChartProps) {
  const [period, setPeriod] = useState<TrophyPeriod>(initialPeriod)
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<TrophyAnalyticsResult>(initialData)
  const [isPending, startTransition] = useTransition()

  const load = (p: TrophyPeriod, o: number) => {
    startTransition(async () => {
      const result = await getGoalTrophyAnalytics(p, o)
      setData(result)
    })
  }

  const handlePeriod = (p: TrophyPeriod) => {
    setPeriod(p)
    setOffset(0)
    load(p, 0)
  }

  const handlePrev = () => {
    const o = offset - 1
    setOffset(o)
    load(period, o)
  }
  const handleNext = () => {
    if (offset >= 0) return
    const o = offset + 1
    setOffset(o)
    load(period, o)
  }

  const maxVal = Math.max(...data.points.map((p) => p.count), 0)
  const { domain, ticks } = niceYAxis(maxVal)

  const visiblePoints = data.points.map((p, i) => {
    let showLabel = true
    if (period === 'month' && data.points.length > 20) {
      showLabel = i === 0 || (i + 1) % 5 === 0 || i === data.points.length - 1
    }
    return { ...p, displayLabel: showLabel ? p.label : '' }
  })

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload?.length) return null
    const point = payload[0].payload
    const val = point.count as number
    const tooltipLabel = formatTooltipLabel(point, period)
    return (
      <div className="rounded-lg border border-border/60 bg-background px-3 py-2 shadow-lg pointer-events-none">
        <p className="text-[11px] text-muted-foreground mb-0.5">{tooltipLabel}</p>
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3 w-3" style={{ color: amber }} />
          <p className="text-sm font-bold" style={{ color: amber }}>
            {val} goal{val !== 1 ? 's' : ''} claimed
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Goals claimed</p>
            <p className="text-xs text-muted-foreground">{data.periodLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-0.5">
          {(Object.keys(PERIOD_LABELS) as TrophyPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePeriod(p)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={offset >= 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-sm font-bold text-foreground">{data.total}</span>
          <span className="text-xs text-muted-foreground">claimed this period</span>
        </div>
      </div>

      <div className={cn('transition-opacity', isPending && 'opacity-50')} style={{ height: 200 }}>
        {data.total === 0 && !isPending ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/60">No goals claimed this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visiblePoints} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-border/30"
                vertical={false}
              />
              <XAxis
                dataKey="displayLabel"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                className="text-muted-foreground/60"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={domain}
                ticks={ticks}
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'currentColor' }}
                className="text-muted-foreground/60"
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: `${amber}10` }}
                position={{ y: 0 }}
                wrapperStyle={{ zIndex: 50 }}
              />
              <Bar dataKey="count" fill={amber} radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {data.claimed.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-border/40">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">
            Claimed goals
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {data.claimed.map((g, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl bg-muted/30 px-3 py-2">
                <Trophy className="h-3 w-3 shrink-0" style={{ color: g.habitColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {g.goalDescription}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 truncate">{g.habitName}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/50 shrink-0">
                  {formatDistanceToNow(new Date(g.completedAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
