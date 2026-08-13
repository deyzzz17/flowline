'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog'

export function PlanSelectionDialog({
  icon,
  title,
  description,
  items,
  limit,
  isSubmitting,
  confirmLabel,
  onConfirm,
}: {
  icon: React.ReactNode
  title: string
  description: React.ReactNode
  items: { id: number; label: string; color?: string; badge?: string }[]
  limit: number
  isSubmitting: boolean
  confirmLabel: string
  onConfirm: (keepIds: number[]) => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(items.slice(0, limit).map((i) => i.id)),
  )
  const selectedCount = selectedIds.size
  const isValid = selectedCount === limit

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= limit) return prev
        next.add(id)
      }
      return next
    })
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">{description}</p>

          <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-border/50 p-2">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id)
              const disabled = !isSelected && selectedCount >= limit
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  disabled={disabled}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
                    isSelected
                      ? 'border-violet-500/40 bg-violet-500/10'
                      : disabled
                        ? 'border-border/30 opacity-40 cursor-not-allowed'
                        : 'border-border/60 bg-background hover:bg-muted',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all',
                      isSelected ? 'border-violet-500 bg-violet-500' : 'border-border/60',
                    )}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  {item.color && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <span className="flex-1 truncate font-medium text-foreground">{item.label}</span>
                  {item.badge && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <p className="text-center text-xs font-medium text-muted-foreground">
            {selectedCount} / {limit} selected
          </p>
        </div>

        <DialogFooter className="pt-1">
          <button
            type="button"
            onClick={() => onConfirm(Array.from(selectedIds))}
            disabled={!isValid || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
