'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  trend?: { value: string; up: boolean }
}

export function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-all hover:border-border hover:shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium',
            trend.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
          )}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-xs font-medium text-muted-foreground/60">{sub}</div>}
    </div>
  )
}