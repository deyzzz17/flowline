'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Clock,
  Timer,
  Star,
  BarChart2,
  TrendingUp,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from './stat-card'
import { TimePeriodSelector, type TimePeriod } from './time-period-selector'
import { TimeByCategoryChart } from './time-by-category-chart'
import { TimeBySubcategoryChart } from './time-by-subcategory-chart'
import { DistributionChart } from './distribution-chart'
import { FocusQualityChart } from './focus-quality-chart'
import { getTimerAnalytics, type SessionAnalytics } from '@/api/timer-analytics/actions'
import { cn } from '@/lib/utils'

function formatSeconds(s: number): string {
  if (s === 0) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

interface AnalyticsClientProps {
  initialData: SessionAnalytics
  initialPeriod: TimePeriod
}

export function AnalyticsClient({ initialData, initialPeriod }: AnalyticsClientProps) {
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod)
  const [offset, setOffset] = useState(0)
  const [subcategoryPeriod, setSubcategoryPeriod] = useState<TimePeriod>(initialPeriod)
  const [subcategoryOffset, setSubcategoryOffset] = useState(0)

  const [data, setData] = useState<SessionAnalytics>(initialData)
  const [subcategoryData, setSubcategoryData] = useState<SessionAnalytics>(initialData)
  const [selectedDistCategory, setSelectedDistCategory] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSubPending, startSubTransition] = useTransition()

  const fetchData = (p: TimePeriod, o: number) => {
    startTransition(async () => {
      const fresh = await getTimerAnalytics(p, o)
      setData(fresh)
    })
  }

  const fetchSubData = (p: TimePeriod, o: number) => {
    startSubTransition(async () => {
      const fresh = await getTimerAnalytics(p, o)
      setSubcategoryData(fresh)
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

  const handleSubPeriodChange = (p: TimePeriod) => {
    setSubcategoryPeriod(p)
    setSubcategoryOffset(0)
    fetchSubData(p, 0)
  }

  const handleSubNavigate = (dir: 'prev' | 'next') => {
    const newOffset = subcategoryOffset + (dir === 'prev' ? -1 : 1)
    setSubcategoryOffset(newOffset)
    fetchSubData(subcategoryPeriod, newOffset)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <div className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="h-4 w-4 text-violet-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
                Analytics
              </p>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Focus insights
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your productivity and focus patterns over time.
            </p>
          </div>
          <Link
            href="/timer"
            className="mt-1 flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all hover:bg-muted hover:text-foreground shrink-0"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to timer
          </Link>
        </div>
      </div>

      <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total focus time"
          value={formatSeconds(data.totalSeconds)}
          sub={data.periodLabel ?? `This ${period}`}
          icon={Clock}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-500/10"
        />
        <StatCard
          label="Sessions completed"
          value={data.totalSessions > 0 ? String(data.totalSessions) : '—'}
          sub={data.periodLabel ?? `This ${period}`}
          icon={Timer}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          label="Avg session length"
          value={formatSeconds(data.avgSessionSeconds)}
          sub="Per session"
          icon={TrendingUp}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          label="Avg focus quality"
          value={
            data.focusQuality.global.sessions > 0
              ? `${data.focusQuality.global.avgRating.toFixed(1)} ★`
              : '—'
          }
          sub={
            data.focusQuality.global.sessions > 0
              ? `${data.focusQuality.global.sessions} rated`
              : 'No ratings yet'
          }
          icon={Star}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
        />
      </section>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-foreground">Time by category</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Focus time over time</p>
              </div>
              <div className="flex items-center gap-2">
                {isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
                )}
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
            <div className={cn('p-5 transition-opacity', isPending && 'opacity-40')}>
              <TimeByCategoryChart
                data={data.timeSeries ?? []}
                series={data.seriesDefinitions ?? []}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
            <div className="border-b border-border/50 px-5 py-4">
              <p className="text-sm font-semibold text-foreground">
                {selectedDistCategory ? `${selectedDistCategory} breakdown` : 'Time distribution'}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {selectedDistCategory ? 'Click back to return' : 'Click to explore sub-categories'}
              </p>
            </div>
            <div className="p-5">
              <DistributionChart
                categoryData={data.timeByCategory}
                subcategoryData={data.timeBySubcategory}
                selectedCategory={selectedDistCategory}
                onSelectCategory={setSelectedDistCategory}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-foreground">Time by sub-category</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Filter by category to drill down
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSubPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
              )}
              <TimePeriodSelector value={subcategoryPeriod} onChange={handleSubPeriodChange} />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleSubNavigate('prev')}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span
                  className={cn(
                    'text-xs font-medium text-foreground min-w-24 text-center transition-opacity',
                    isSubPending && 'opacity-40',
                  )}
                >
                  {subcategoryData.periodLabel}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleSubNavigate('next')}
                  disabled={subcategoryOffset >= 0}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <div className={cn('p-5 transition-opacity', isSubPending && 'opacity-40')}>
            <TimeBySubcategoryChart
              data={subcategoryData.timeSeries ?? []}
              series={subcategoryData.seriesDefinitions ?? []}
              allCategories={subcategoryData.allCategories}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
          <div className="border-b border-border/50 px-5 py-4">
            <p className="text-sm font-semibold text-foreground">Focus quality</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Average session ratings — by category and sub-category
            </p>
          </div>
          <div className="p-5">
            <FocusQualityChart
              global={data.focusQuality.global}
              byCategory={data.focusQuality.byCategory}
              bySubcategory={(data.focusQuality as any).bySubcategory ?? []}
              initialData={data}
              initialPeriod={period}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
