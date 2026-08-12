'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, ClipboardList, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chooseListsToKeep } from '@/api/lists/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { List } from '@/payload-types'

export interface ListsComplianceInfo {
  overBy: number
  limit: number
  lists: List[]
}

interface ListsComplianceDialogProps {
  initialCompliance: ListsComplianceInfo | null
}

export function ListsComplianceDialog({ initialCompliance }: ListsComplianceDialogProps) {
  const queryClient = useQueryClient()
  const [compliance, setCompliance] = useState(initialCompliance)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () =>
      new Set(
        (initialCompliance?.lists ?? []).slice(0, initialCompliance?.limit ?? 0).map((l) => l.id),
      ),
  )

  if (!compliance) return null

  const { limit, lists } = compliance
  const selectedCount = selectedIds.size
  const isValid = selectedCount === limit

  const toggleList = (id: number) => {
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

  const handleConfirm = async () => {
    if (!isValid) return
    setIsSubmitting(true)
    try {
      const result = await chooseListsToKeep(Array.from(selectedIds))
      if (!result.ok) {
        toast.error('Something went wrong. Please try again.')
        return
      }
      toast.info('Lists updated', {
        description: `${lists.length - limit} list${lists.length - limit !== 1 ? 's' : ''} archived. You can restore any of them later from Settings.`,
      })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      setCompliance(null)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!compliance} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-violet-500" />
            Choose which lists to keep
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">
            Your current plan allows <strong>{limit}</strong> active list
            {limit !== 1 ? 's' : ''}, but you have <strong>{lists.length}</strong>. Choose which
            ones to keep, the rest will be archived, not deleted. You can restore them anytime from
            Settings if you need more space.
          </p>

          <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-border/50 p-2">
            {lists.map((list) => {
              const isSelected = selectedIds.has(list.id)
              const disabled = !isSelected && selectedCount >= limit
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => toggleList(list.id)}
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
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: list.category?.color ?? '#8b5cf6' }}
                  />
                  <span className="flex-1 truncate font-medium text-foreground">{list.name}</span>
                  {list.isDefault && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Default
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
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Confirm selection'
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
