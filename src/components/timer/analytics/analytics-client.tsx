'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Clock, Timer, Star, BarChart2, TrendingUp, ArrowLeft, Loader2 } from 'lucide-react'
import { StatCard } from './stat-card'
import { TimePeriodSelector, type TimePeriod } from './time-period-selector'
import { TimeByCategoryChart } from './time-by-category-chart'
import { TimeBySubcategoryChart } from './time-by-subcategory-chart'
import { DistributionChart } from './distribution-chart'
import { FocusQualityChart } from './focus-quality-chart'
import { getTimerAnalytics, type SessionAnalytics } from '@/api/timer/actions'

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
  const [subcategoryPeriod, setSubcategoryPeriod] = useState<TimePeriod>(initialPeriod)
  const [data, setData] = useState<SessionAnalytics>(initialData)
  const [subcategoryData, setSubcategoryData] = useState<SessionAnalytics>(initialData)
  const [selectedDistCategory, setSelectedDistCategory] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSubPending, startSubTransition] = useTransition()

  const handlePeriodChange = (p: TimePeriod) => {
    setPeriod(p)
    startTransition(async () => {
      const fresh = await getTimerAnalytics(p)
      setData(fresh)
    })
  }

  const handleSubPeriodChange = (p: TimePeriod) => {
    setSubcategoryPeriod(p)
    startSubTransition(async () => {
      const fresh = await getTimerAnalytics(p)
      setSubcategoryData(fresh)
    })
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <div className="mb-10">
        <Link
          href="/timer"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to timer
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="h-4 w-4 text-violet-500" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
            Analytics
          </p>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Focus insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your productivity and focus patterns over time.
        </p>
      </div>

      <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total focus time"
          value={formatSeconds(data.totalSeconds)}
          sub={`This ${period}`}
          icon={Clock}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-500/10"
        />
        <StatCard
          label="Sessions completed"
          value={data.totalSessions > 0 ? String(data.totalSessions) : '—'}
          sub={`This ${period}`}
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
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Time by category</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Focus time over time</p>
              </div>
              <div className="flex items-center gap-2">
                {isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
                )}
                <TimePeriodSelector value={period} onChange={handlePeriodChange} />
              </div>
            </div>
            <div className="p-5">
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
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
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
            </div>
          </div>
          <div className="p-5">
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
