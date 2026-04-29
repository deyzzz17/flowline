'use client'

import { useState } from 'react'
import { EmptyState } from './empty-state'

interface DistributionItem {
  name: string
  value: number
  color: string
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

function DonutChart({
  data,
  total,
  selectedCategory,
  onSelect,
}: {
  data: DistributionItem[]
  total: number
  selectedCategory: string | null
  onSelect: (name: string) => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: DistributionItem } | null>(
    null,
  )

  const cx = 90
  const cy = 90
  const r = 70
  const innerR = 45
  const gap = 0.03

  let cumAngle = -Math.PI / 2

  const segments = data.map((item) => {
    const fraction = item.value / total
    const angle = fraction * 2 * Math.PI - gap
    const startAngle = cumAngle + gap / 2
    const endAngle = startAngle + angle
    cumAngle += fraction * 2 * Math.PI

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const ix1 = cx + innerR * Math.cos(endAngle)
    const iy1 = cy + innerR * Math.sin(endAngle)
    const ix2 = cx + innerR * Math.cos(startAngle)
    const iy2 = cy + innerR * Math.sin(startAngle)
    const largeArc = angle > Math.PI ? 1 : 0

    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ')

    return { ...item, d, fraction }
  })

  return (
    <div className="relative">
      <svg width={180} height={180} viewBox="0 0 180 180">
        {segments.map((seg) => {
          const isHovered = hovered === seg.name
          const scale = isHovered ? 1.04 : 1
          return (
            <path
              key={seg.name}
              d={seg.d}
              fill={seg.color}
              fillOpacity={isHovered ? 1 : 0.82}
              stroke="var(--background)"
              strokeWidth={1.5}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: '90px 90px',
                transition: 'all 0.15s ease',
                cursor: selectedCategory ? 'default' : 'pointer',
              }}
              onMouseEnter={(e) => {
                setHovered(seg.name)
                const rect = (e.target as SVGPathElement).closest('svg')!.getBoundingClientRect()
                setTooltip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  item: seg,
                })
              }}
              onMouseLeave={() => {
                setHovered(null)
                setTooltip(null)
              }}
              onClick={() => {
                if (!selectedCategory) onSelect(seg.name)
              }}
            />
          )
        })}

        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill="currentColor"
          className="fill-foreground"
        >
          {formatSeconds(total)}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize={9}
          fill="currentColor"
          className="fill-muted-foreground"
          opacity={0.6}
        >
          total
        </text>
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-lg text-xs"
          style={{ left: tooltip.x + 8, top: tooltip.y - 32 }}
        >
          <p className="font-semibold text-foreground mb-0.5">{tooltip.item.name}</p>
          <p className="text-muted-foreground">
            {formatSeconds(tooltip.item.value)} · {Math.round((tooltip.item.value / total) * 100)}%
          </p>
        </div>
      )}
    </div>
  )
}

interface DistributionChartProps {
  categoryData: { name: string; seconds: number; color: string }[]
  subcategoryData: { name: string; category: string; seconds: number; color: string }[]
  selectedCategory: string | null
  onSelectCategory: (name: string | null) => void
}

export function DistributionChart({
  categoryData,
  subcategoryData,
  selectedCategory,
  onSelectCategory,
}: DistributionChartProps) {
  const rawData = selectedCategory
    ? subcategoryData
        .filter((d) => d.category === selectedCategory)
        .map((d) => ({ name: d.name, value: d.seconds, color: d.color }))
    : categoryData.map((d) => ({ name: d.name, value: d.seconds, color: d.color }))

  if (rawData.length === 0) {
    return (
      <EmptyState
        message={
          selectedCategory
            ? `No sub-categories for ${selectedCategory} yet.`
            : 'Complete sessions with categories to see distribution.'
        }
      />
    )
  }

  const total = rawData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <DonutChart
          data={rawData}
          total={total}
          selectedCategory={selectedCategory}
          onSelect={onSelectCategory}
        />
      </div>

      <div className="space-y-2">
        {rawData.map((item) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0
          return (
            <div
              key={item.name}
              className="space-y-1 cursor-pointer group"
              onClick={() => !selectedCategory && onSelectCategory(item.name)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-foreground truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatSeconds(item.value)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 tabular-nums w-7 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="h-1 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: item.color, opacity: 0.75 }}
                />
              </div>
            </div>
          )
        })}

        {selectedCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className="mt-1 text-[11px] text-violet-600 dark:text-violet-400 hover:underline text-left"
          >
            ← Back to categories
          </button>
        )}
      </div>
    </div>
  )
}
