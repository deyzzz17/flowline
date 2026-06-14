'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getHeatmapAnalytics, type HeatmapAnalyticsResult } from '@/api/habits-analytics/actions'

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const DAY_LABELS = ['Mon', 'Wed', 'Fri']
const DAY_LABEL_ROWS = [1, 3, 5]

interface TooltipState {
  visible: boolean
  x: number
  y: number
  text: string
}

interface YearHeatmapProps {
  initialData: HeatmapAnalyticsResult
}

export function YearHeatmap({ initialData }: YearHeatmapProps) {
  const [data, setData] = useState(initialData)
  const [isPending, startTransition] = useTransition()
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, text: '' })

  const currentYear = new Date().getFullYear()
  const todayKey = new Intl.DateTimeFormat('en-CA').format(new Date())

  const handleYear = (year: number) => {
    startTransition(async () => {
      const result = await getHeatmapAnalytics(year)
      setData(result)
    })
  }

  type Cell = { date: string; count: number; total: number; isFuture: boolean } | null

  const columns: Cell[][] = []
  let currentCol: Cell[] = []

  if (data.data.length > 0) {
    const firstDate = new Date(data.data[0].date + 'T12:00:00')
    const firstDow = (firstDate.getDay() + 6) % 7
    for (let i = 0; i < firstDow; i++) currentCol.push(null)
  }

  for (const d of data.data) {
    const isFuture = d.date > todayKey
    currentCol.push({ ...d, isFuture })
    if (currentCol.length === 7) {
      columns.push(currentCol)
      currentCol = []
    }
  }
  if (currentCol.length > 0) {
    while (currentCol.length < 7) currentCol.push(null)
    columns.push(currentCol)
  }

  const monthPositions: { label: string; colIndex: number }[] = []
  let lastMonth = -1
  columns.forEach((col, ci) => {
    const firstReal = col.find(Boolean) as { date: string } | null
    if (!firstReal) return
    const m = new Date(firstReal.date + 'T12:00:00').getMonth()
    if (m !== lastMonth) {
      monthPositions.push({ label: MONTH_LABELS[m], colIndex: ci })
      lastMonth = m
    }
  })

  const getIntensity = (cell: Cell) => {
    if (!cell || cell.total === 0 || cell.isFuture) return 0
    return cell.count
  }

  const getCellColor = (cell: Cell): string => {
    if (!cell) return ''
    if (cell.isFuture) return 'bg-muted/20 dark:bg-muted/10'
    if (cell.total === 0) return 'bg-muted/50 dark:bg-muted/30'
    const intensity = getIntensity(cell)
    if (intensity === 0) return 'bg-muted/50 dark:bg-muted/30'
    if (intensity <= 0.25) return 'bg-violet-200 dark:bg-violet-900/70'
    if (intensity <= 0.5) return 'bg-violet-300 dark:bg-violet-700'
    if (intensity <= 0.75) return 'bg-violet-400 dark:bg-violet-500'
    return 'bg-violet-500 dark:bg-violet-400'
  }

  const getLegendColor = (intensity: number): string => {
    if (intensity === 0) return 'bg-muted/50 dark:bg-muted/30'
    if (intensity <= 0.25) return 'bg-violet-200 dark:bg-violet-900/70'
    if (intensity <= 0.5) return 'bg-violet-300 dark:bg-violet-700'
    if (intensity <= 0.75) return 'bg-violet-400 dark:bg-violet-500'
    return 'bg-violet-500 dark:bg-violet-400'
  }

  const handleMouseEnter = (e: React.MouseEvent, cell: Cell) => {
    if (!cell) return
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const dateLabel = new Date(cell.date + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const text = cell.isFuture
      ? `${dateLabel}`
      : cell.total === 0
        ? `${dateLabel}: no target`
        : `${dateLabel}: ${cell.count}/${cell.total} completed`
    setTooltip({ visible: true, x: rect.left + rect.width / 2, y: rect.top - 6, text })
  }

  const totalDaysCompleted = data.data.filter((d) => d.count > 0 && d.date <= todayKey).length
  const totalDaysTarget = data.data.filter((d) => d.total > 0 && d.date <= todayKey).length

  const colCount = columns.length

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Completion heatmap</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalDaysCompleted} days completed out of {totalDaysTarget} targets in {data.year}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleYear(data.year - 1)}
            disabled={isPending}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="w-12 text-center text-sm font-semibold text-foreground">
            {data.year}
          </span>
          <button
            type="button"
            onClick={() => handleYear(data.year + 1)}
            disabled={isPending || data.year >= currentYear}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {tooltip.visible && (
        <div
          className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background shadow-md whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
        </div>
      )}

      <div
        className={cn('relative select-none w-full', isPending && 'opacity-50 transition-opacity')}
      >
        <div className="flex w-full mb-1" style={{ paddingLeft: 28 }}>
          {columns.map((_, ci) => {
            const mp = monthPositions.find((m) => m.colIndex === ci)
            return (
              <div
                key={ci}
                className="overflow-hidden text-[9px] text-muted-foreground/50"
                style={{ width: `${100 / colCount}%`, flexShrink: 0 }}
              >
                {mp ? mp.label : ''}
              </div>
            )
          })}
        </div>

        <div className="flex w-full">
          <div className="flex flex-col shrink-0 mr-1" style={{ width: 24, gap: 2 }}>
            {Array.from({ length: 7 }, (_, row) => (
              <div
                key={row}
                className="flex items-center justify-end text-[9px] text-muted-foreground/40 pr-1"
                style={{ height: 'calc((100% - 12px) / 7)' }}
              >
                {DAY_LABEL_ROWS.includes(row) ? DAY_LABELS[DAY_LABEL_ROWS.indexOf(row)] : ''}
              </div>
            ))}
          </div>

          <div className="flex flex-1 min-w-0" style={{ gap: 2 }}>
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
                {col.map((cell, ri) => (
                  <div
                    key={ri}
                    className={cn(
                      'rounded-[2px] transition-all w-full',
                      'aspect-square',
                      cell ? getCellColor(cell) : 'bg-transparent',
                      cell && !cell.isFuture && cell.total > 0
                        ? 'cursor-default'
                        : 'cursor-default',
                    )}
                    onMouseEnter={cell ? (e) => handleMouseEnter(e, cell) : undefined}
                    onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-1.5">
          <span className="text-[10px] text-muted-foreground/50">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
            <div key={i} className={cn('h-3 w-3 rounded-[2px]', getLegendColor(v))} />
          ))}
          <span className="text-[10px] text-muted-foreground/50">More</span>
        </div>
      </div>
    </div>
  )
}
