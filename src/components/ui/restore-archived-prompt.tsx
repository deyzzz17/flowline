'use client'

import { useState } from 'react'
import { X, Undo2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'

export interface RestorableItem {
  id: number
  label: string
  color?: string
}

interface RestoreArchivedPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  items: RestorableItem[]
  onRestore: (id: number) => Promise<{ ok: boolean; error?: string }>
  onRestored?: (id: number) => void
}

export function RestoreArchivedPrompt({
  open,
  onOpenChange,
  title,
  description,
  items,
  onRestore,
  onRestored,
}: RestoreArchivedPromptProps) {
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
      onRestored?.(id)
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
