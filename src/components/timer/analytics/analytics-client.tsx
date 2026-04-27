'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Timer, Clock, Flame, Star, BarChart2, TrendingUp, ArrowLeft } from 'lucide-react'
import { StatCard } from './stat-card'
import { TimePeriodSelector, type TimePeriod } from './time-period-selector'
import { TimeByCategoryChart } from './time-by-category-chart'
import { TimeBySubcategoryChart } from './time-by-subcategory-chart'
import { DistributionChart } from './distribution-chart'
import { FocusQualityChart } from './focus-quality-chart'

export function AnalyticsClient() {
  const [period, setPeriod] = useState<TimePeriod>('week')
  const [subcategoryPeriod, setSubcategoryPeriod] = useState<TimePeriod>('week')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [subcategoryFilter, setSubcategoryFilter] = useState('All')

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <div className="mb-10 flex items-start justify-between">
        <div>
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
      </div>

      <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total focus time"
          value="47h 20m"
          sub="This month"
          icon={Clock}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBg="bg-violet-500/10"
          trend={{ value: '12%', up: true }}
        />
        <StatCard
          label="Sessions completed"
          value="42"
          sub="This month"
          icon={Timer}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-500/10"
          trend={{ value: '8%', up: true }}
        />
        <StatCard
          label="Avg session length"
          value="1h 07m"
          sub="Per session"
          icon={TrendingUp}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-500/10"
          trend={{ value: '5%', up: true }}
        />
        <StatCard
          label="Avg focus quality"
          value="3.8 ★"
          sub="Out of 5"
          icon={Star}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          trend={{ value: '0.2', up: true }}
        />
      </section>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Time by category</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Focus time per category</p>
              </div>
              <TimePeriodSelector value={period} onChange={setPeriod} />
            </div>
            <div className="p-5">
              <TimeByCategoryChart period={period} />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
            <div className="border-b border-border/50 px-5 py-4">
              <p className="text-sm font-semibold text-foreground">
                {selectedCategory ? `${selectedCategory} — sub-categories` : 'Time distribution'}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {selectedCategory ? 'Click a bar to drill down' : 'Click to explore sub-categories'}
              </p>
            </div>
            <div className="p-5">
              <DistributionChart
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
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
            <TimePeriodSelector value={subcategoryPeriod} onChange={setSubcategoryPeriod} />
          </div>
          <div className="p-5">
            <TimeBySubcategoryChart
              period={subcategoryPeriod}
              selectedCategory={subcategoryFilter}
              onSelectCategory={setSubcategoryFilter}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
          <div className="border-b border-border/50 px-5 py-4">
            <p className="text-sm font-semibold text-foreground">Focus quality</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Average session ratings — global and per category
            </p>
          </div>
          <div className="p-5">
            <FocusQualityChart />
          </div>
        </div>
      </div>
    </div>
  )
}
