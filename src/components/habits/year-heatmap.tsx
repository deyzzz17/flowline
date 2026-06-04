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
  const containerRef = { current: null as HTMLDivElement | null }

  const currentYear = new Date().getFullYear()

  const handleYear = (year: number) => {
    startTransition(async () => {
      const result = await getHeatmapAnalytics(year)
      setData(result)
    })
  }

  type Cell = { date: string; count: number; total: number } | null
  const columns: Cell[][] = []
  let currentCol: Cell[] = []

  if (data.data.length > 0) {
    const firstDate = new Date(data.data[0].date + 'T12:00:00')
    const firstDow = (firstDate.getDay() + 6) % 7
    for (let i = 0; i < firstDow; i++) currentCol.push(null)
  }

  for (const d of data.data) {
    currentCol.push(d)
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
    if (!cell || cell.total === 0) return 0
    return cell.count / cell.total
  }

  const getCellColor = (intensity: number): string => {
    if (intensity === 0) return ''
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
    const text =
      cell.total === 0
        ? `${dateLabel}: no target`
        : `${dateLabel}: ${cell.count}/${cell.total} completed`
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 6,
      text,
    })
  }

  const CELL = 11
  const GAP = 2

  const totalDaysCompleted = data.data.filter((d) => d.count > 0).length
  const totalDaysTarget = data.data.filter((d) => d.total > 0).length

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

      <div
        ref={(n) => {
          containerRef.current = n
        }}
        className={cn(
          'relative select-none overflow-x-auto',
          isPending && 'opacity-50 transition-opacity',
        )}
      >
        {tooltip.visible && (
          <div
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background shadow-md whitespace-nowrap"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
          </div>
        )}

        <div className="flex mb-1 pl-7">
          {columns.map((_, ci) => {
            const mp = monthPositions.find((m) => m.colIndex === ci)
            return (
              <div
                key={ci}
                style={{ width: CELL + GAP, flexShrink: 0 }}
                className="text-[10px] text-muted-foreground/50 overflow-hidden"
              >
                {mp ? mp.label : ''}
              </div>
            )
          })}
        </div>

        <div className="flex gap-0">
          <div className="flex flex-col mr-1" style={{ gap: GAP, width: 24 }}>
            {Array.from({ length: 7 }, (_, row) => (
              <div
                key={row}
                style={{ height: CELL }}
                className="flex items-center justify-end text-[9px] text-muted-foreground/40 pr-1"
              >
                {DAY_LABEL_ROWS.includes(row) ? DAY_LABELS[DAY_LABEL_ROWS.indexOf(row)] : ''}
              </div>
            ))}
          </div>

          <div className="flex" style={{ gap: GAP }}>
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col" style={{ gap: GAP }}>
                {col.map((cell, ri) => (
                  <div
                    key={ri}
                    style={{ width: CELL, height: CELL }}
                    className={cn(
                      'rounded-[2px] transition-all',
                      cell
                        ? cell.total === 0
                          ? 'bg-transparent cursor-default'
                          : cn(
                              'cursor-default',
                              getCellColor(getIntensity(cell)) || 'bg-muted/50 dark:bg-muted/30',
                            )
                        : 'bg-transparent',
                    )}
                    onMouseEnter={
                      cell && cell.total > 0 ? (e) => handleMouseEnter(e, cell) : undefined
                    }
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
            <div
              key={i}
              style={{ width: CELL, height: CELL }}
              className={cn(
                'rounded-[2px]',
                v === 0 ? 'bg-muted/50 dark:bg-muted/30' : getCellColor(v),
              )}
            />
          ))}
          <span className="text-[10px] text-muted-foreground/50">More</span>
        </div>
      </div>
    </div>
  )
}
