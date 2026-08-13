'use client'

import { useState } from 'react'
import { X, Undo2, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export interface RestorableItem {
  id: number
  label: string
  color?: string
}

interface RestoreArchivedPromptBaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  items: RestorableItem[]
}

interface LegacySingleRestoreProps extends RestoreArchivedPromptBaseProps {
  onRestore: (id: number) => Promise<{ ok: boolean; error?: string }>
  maxSelectable?: undefined
  onConfirm?: undefined
}

interface MultiSelectRestoreProps extends RestoreArchivedPromptBaseProps {
  maxSelectable: number
  onConfirm: (ids: number[]) => Promise<{ ok: boolean; error?: string }>
  onRestore?: undefined
}

type RestoreArchivedPromptProps = LegacySingleRestoreProps | MultiSelectRestoreProps

export function RestoreArchivedPrompt(props: RestoreArchivedPromptProps) {
  if (props.onConfirm) {
    return <MultiSelectRestorePrompt {...props} />
  }
  return <LegacySingleRestorePrompt {...(props as LegacySingleRestoreProps)} />
}

function MultiSelectRestorePrompt({
  open,
  onOpenChange,
  title,
  description,
  items,
  maxSelectable,
  onConfirm,
}: MultiSelectRestoreProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isConfirming, setIsConfirming] = useState(false)

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < maxSelectable) {
        next.add(id)
      }
      return next
    })
  }

  const handleClose = (v: boolean) => {
    if (!v) {
      setSelectedIds(new Set())
      setIsConfirming(false)
    }
    onOpenChange(v)
  }

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return
    setIsConfirming(true)
    try {
      const result = await onConfirm(Array.from(selectedIds))
      if (result.ok) {
        handleClose(false)
      }
    } finally {
      setIsConfirming(false)
    }
  }

  const atCapacity = selectedIds.size >= maxSelectable

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-sm">
        <button
          type="button"
          onClick={() => handleClose(false)}
          className="absolute right-4 top-4 text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Undo2 className="h-4 w-4 text-violet-500" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}{' '}
            <span className="font-medium text-foreground">
              You can restore {maxSelectable} of {items.length}.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-64 space-y-1.5 overflow-y-auto py-1">
          {items.map((item) => {
            const isSelected = selectedIds.has(item.id)
            const isDisabled = !isSelected && atCapacity
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                disabled={isDisabled}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  isSelected
                    ? 'border-violet-500/50 bg-violet-500/5'
                    : 'border-border/50 hover:bg-muted/40',
                  isDisabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                )}
              >
                <span
                  className={cn(
                    'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-colors',
                    isSelected ? 'border-violet-600 bg-violet-600' : 'border-border bg-background',
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </span>
                {item.color && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="flex-1 truncate text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => handleClose(false)}>
            Skip
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={selectedIds.size === 0 || isConfirming}
            className="gap-1.5 bg-violet-600 hover:bg-violet-500"
          >
            {isConfirming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              `Restore${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function LegacySingleRestorePrompt({
  open,
  onOpenChange,
  title,
  description,
  items,
  onRestore,
}: LegacySingleRestoreProps) {
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [restoredIds, setRestoredIds] = useState<Set<number>>(new Set())
  const [fullId, setFullId] = useState<number | null>(null)

  const handleRestore = async (id: number) => {
    setRestoringId(id)
    setFullId(null)
    try {
      const result = await onRestore(id)
      if (!result.ok) {
        if (result.error === 'LIMIT_FULL') {
          setFullId(id)
        }
        return
      }
      setRestoredIds((prev) => new Set(prev).add(id))
    } finally {
      setRestoringId(null)
    }
  }

  const remaining = items.filter((i) => !restoredIds.has(i.id))

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-sm">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Undo2 className="h-4 w-4 text-violet-500" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {remaining.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">All set!</p>
        ) : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto py-1">
            {remaining.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 rounded-xl border border-border/50 px-3 py-2.5"
              >
                {item.color && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="flex-1 truncate text-sm font-medium text-foreground">
                  {item.label}
                </span>
                {fullId === item.id ? (
                  <span className="text-xs text-muted-foreground">Still full</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRestore(item.id)}
                    disabled={restoringId === item.id}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-50',
                    )}
                  >
                    {restoringId === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Restore'
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
