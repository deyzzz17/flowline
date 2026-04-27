'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Star, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'

interface SessionRatingDialogProps {
  open: boolean
  onClose: (data: { rating: number; taskCompleted: boolean | null }) => void
  taskId?: number | null
  taskTitle?: string
  categoryName?: string
}

export function SessionRatingDialog({
  open,
  onClose,
  taskId,
  taskTitle,
  categoryName,
}: SessionRatingDialogProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [taskCompleted, setTaskCompleted] = useState<boolean | null>(null)
  const queryClient = useQueryClient()

  const completeTaskMutation = useMutation({
    mutationFn: (id: number) => api.tasks.toggleStatus(id, 'active'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleClose = async () => {
    if (taskCompleted && taskId) {
      await completeTaskMutation.mutateAsync(taskId)
    }
    onClose({ rating, taskCompleted })
    setRating(0)
    setHovered(0)
    setTaskCompleted(null)
  }

  const hasTask = !!taskId && !!taskTitle
  const canSubmit = rating > 0 && (!hasTask || taskCompleted !== null)

  const displayValue = hovered > 0 ? hovered : rating

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-base">Session complete 🎉</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {categoryName && (
            <p className="text-center text-sm text-muted-foreground">
              How was your <span className="font-medium text-foreground">{categoryName}</span>{' '}
              session?
            </p>
          )}

          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
              Rate your session
            </p>
            <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
              {[1, 2, 3, 4, 5].map((star) => {
                const fullValue = star
                const halfValue = star - 0.5
                const isFull = displayValue >= fullValue
                const isHalf = !isFull && displayValue >= halfValue

                return (
                  <div key={star} className="relative flex h-9 w-9 items-center justify-center">
                    <div
                      className="absolute inset-y-0 left-0 w-1/2 cursor-pointer z-10"
                      onMouseEnter={() => setHovered(halfValue)}
                      onClick={() => setRating(halfValue)}
                    />
                    <div
                      className="absolute inset-y-0 right-0 w-1/2 cursor-pointer z-10"
                      onMouseEnter={() => setHovered(fullValue)}
                      onClick={() => setRating(fullValue)}
                    />

                    <Star
                      className={cn(
                        'h-8 w-8 transition-all duration-100',
                        isFull
                          ? 'fill-amber-400 text-amber-400 scale-110'
                          : 'fill-none text-muted-foreground/30',
                      )}
                    />

                    {isHalf && (
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        <div className="w-1/2 overflow-hidden">
                          <Star className="h-8 w-8 fill-amber-400 text-amber-400 scale-110" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="h-4 text-xs text-muted-foreground/70">
              {displayValue === 0
                ? ''
                : displayValue <= 1
                  ? 'Poor'
                  : displayValue <= 2
                    ? 'Fair'
                    : displayValue <= 3
                      ? 'Good'
                      : displayValue <= 4
                        ? 'Great'
                        : 'Excellent!'}
            </p>
          </div>

          {hasTask && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <p className="text-sm text-center">
                Did you complete{' '}
                <span className="font-medium text-foreground truncate">
                  &ldquo;{taskTitle}&rdquo;
                </span>
                ?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTaskCompleted(true)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all',
                    taskCompleted === true
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setTaskCompleted(false)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all',
                    taskCompleted === false
                      ? 'border-muted-foreground/30 bg-muted text-foreground'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  Not yet
                </button>
              </div>
            </div>
          )}

          <Button
            onClick={handleClose}
            disabled={!canSubmit || completeTaskMutation.isPending}
            className="w-full"
          >
            {completeTaskMutation.isPending ? 'Saving...' : 'Done'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
