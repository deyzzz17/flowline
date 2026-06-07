'use client'

import { X, Play, Trash2, Clock, Zap, LayoutList } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimerConfigItem } from '@/hooks/timer/use-timer-configs'
import { configToSessionConfig } from '@/hooks/timer/use-timer-configs'
import type { SessionConfig } from '@/hooks/timer/use-timer'

function formatSeconds(s: number): string {
  if (!s || s === 0) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

function hexToRgba(hex: string, alpha: number) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(139,92,246,${alpha})`
  }
}

interface TimerConfigsSidebarProps {
  open: boolean
  onClose: () => void
  configs: TimerConfigItem[]
  isLoading: boolean
  onStart: (config: SessionConfig) => void
  onDelete: (id: number) => void
}

export function TimerConfigsSidebar({
  open,
  onClose,
  configs,
  isLoading,
  onStart,
  onDelete,
}: TimerConfigsSidebarProps) {
  return (
    <div
      className={cn(
        'shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
        open ? 'w-72' : 'w-0',
      )}
    >
      <div className="w-72 h-full flex flex-col border-l border-border/50 bg-sidebar">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <LayoutList className="h-4 w-4 text-muted-foreground/60" />
            <p className="text-sm font-semibold text-foreground">Saved configs</p>
            {configs.length > 0 && (
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                {configs.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
          {isLoading ? (
            <div className="space-y-2 p-2 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted" />
              ))}
            </div>
          ) : configs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No saved configs</p>
              <p className="text-xs text-muted-foreground/60">
                Configs are saved automatically when you start a session.
              </p>
            </div>
          ) : (
            configs.map((cfg) => (
              <ConfigCard
                key={cfg.id}
                config={cfg}
                onStart={() => onStart(configToSessionConfig(cfg))}
                onDelete={() => onDelete(cfg.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ConfigCard({
  config,
  onStart,
  onDelete,
}: {
  config: TimerConfigItem
  onStart: () => void
  onDelete: () => void
}) {
  const color = config.categoryColor ?? '#8b5cf6'
  const isFree = !config.sessionDuration || config.sessionDuration === 0
  const hasPhases = config.workDuration > 0 && config.breakDuration > 0

  return (
    <div className="group relative rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-all overflow-hidden">
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
        style={{ backgroundColor: color }}
      />

      <div className="pl-3 pr-2 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{config.name}</p>

            <div className="mt-1.5 flex flex-wrap gap-1">
              {config.categoryName && (
                <span
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: hexToRgba(color, 0.1),
                    color,
                    border: `1px solid ${hexToRgba(color, 0.25)}`,
                  }}
                >
                  {config.categoryName}
                </span>
              )}
              {config.subCategory && (
                <span className="inline-flex items-center rounded-full border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {config.subCategory}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              {isFree ? (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                  <Zap className="h-2.5 w-2.5" />
                  Free timer
                  {hasPhases &&
                    ` · ${formatSeconds(config.workDuration)} / ${formatSeconds(config.breakDuration)}`}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground/60">
                  {formatSeconds(config.sessionDuration)}
                  {hasPhases &&
                    ` · ${formatSeconds(config.workDuration)} / ${formatSeconds(config.breakDuration)}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive transition-all"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onStart()
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-all"
              aria-label="Start"
            >
              <Play className="h-3.5 w-3.5 fill-current translate-x-px" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
