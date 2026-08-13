'use client'

import { Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function AnalyticsPlanNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3.5 py-2.5 text-sm text-muted-foreground',
        className,
      )}
    >
      <Zap className="h-4 w-4 shrink-0 text-violet-500" />
      <span>
        Your plan only shows recent history for this period.{' '}
        <Link
          href="/billing"
          className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
        >
          Upgrade
        </Link>{' '}
        to see further back.
      </span>
    </div>
  )
}
