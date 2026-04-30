'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { createTimerSession } from '@/api/timer/actions'
import type { SessionConfig } from '@/hooks/timer/use-timer'

interface SessionRatingDialogProps {
  open: boolean
  onClose: () => void
  config: SessionConfig | null
  totalElapsed: number
}

function StarIcon({ fill }: { fill: 'empty' | 'half' | 'full' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 transition-all duration-100"
      style={{
        filter: fill !== 'empty' ? 'drop-shadow(0 1px 2px rgba(251,191,36,0.3))' : undefined,
      }}
    >
      <defs>
        <linearGradient id={`half-${fill}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={fill === 'full' ? '#fbbf24' : fill === 'half' ? 'url(#half-gradient)' : 'none'}
        stroke={fill === 'empty' ? '#94a3b8' : '#fbbf24'}
        strokeOpacity={fill === 'empty' ? 0.4 : 1}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {fill === 'half' && (
        <>
          <clipPath id="half-clip">
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="#fbbf24"
            clipPath="url(#half-clip)"
          />
        </>
      )}
    </svg>
  )
}

export function SessionRatingDialog({
  open,
  onClose,
  config,
  totalElapsed,
}: SessionRatingDialogProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [taskCompleted, setTaskCompleted] = useState<boolean | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const queryClient = useQueryClient()

  const hasCategory = !!config?.categoryName
  const hasTask = !!config?.taskId && !!config?.taskTitle

  // Étoiles requises seulement si catégorie présente
  // Tâche requiert une réponse si présente
  const canSubmit = (hasCategory ? rating > 0 : true) && (!hasTask || taskCompleted !== null)

  const completeTaskMutation = useMutation({
    mutationFn: (id: number) => api.tasks.toggleStatus(id, 'active'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleClose = async () => {
    if (!config) return
    setIsSaving(true)

    try {
      if (taskCompleted && config.taskId) {
        await completeTaskMutation.mutateAsync(config.taskId)
      }

      const startedAt = new Date(Date.now() - totalElapsed * 1000).toISOString()

      await createTimerSession({
        duration: totalElapsed,
        categoryName: config.categoryName,
        categoryColor: config.categoryColor,
        subCategory: config.subCategory,
        subCategoryColor: config.subCategoryColor,
        taskId: config.taskId,
        taskTitle: config.taskTitle,
        rating: rating > 0 ? rating : undefined,
        taskCompleted: taskCompleted ?? false,
        startedAt,
        timezoneOffset: new Date().getTimezoneOffset(),
      })
    } catch {
    } finally {
      setIsSaving(false)
    }

    setRating(0)
    setHovered(0)
    setTaskCompleted(null)
    onClose()
  }

  const handleDismiss = async () => {
    if (!config) return onClose()
    setIsSaving(true)
    try {
      const startedAt = new Date(Date.now() - totalElapsed * 1000).toISOString()
      await createTimerSession({
        duration: totalElapsed,
        categoryName: config.categoryName,
        categoryColor: config.categoryColor,
        subCategory: config.subCategory,
        subCategoryColor: config.subCategoryColor,
        taskId: config.taskId,
        taskTitle: config.taskTitle,
        rating: undefined,
        taskCompleted: false,
        startedAt,
        timezoneOffset: new Date().getTimezoneOffset(),
      })
    } catch {
    } finally {
      setIsSaving(false)
    }
    setRating(0)
    setHovered(0)
    setTaskCompleted(null)
    onClose()
  }

  const displayValue = hovered > 0 ? hovered : rating

  const getStarFill = (star: number): 'empty' | 'half' | 'full' => {
    if (displayValue >= star) return 'full'
    if (displayValue >= star - 0.5) return 'half'
    return 'empty'
  }

  const ratingLabel =
    displayValue === 0
      ? '\u00a0'
      : displayValue <= 1
        ? 'Poor'
        : displayValue <= 2
          ? 'Fair'
          : displayValue <= 3
            ? 'Good'
            : displayValue <= 4
              ? 'Great'
              : 'Excellent!'

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleDismiss()
      }}
    >
      <DialogContent className="sm:max-w-sm" style={{ marginLeft: 'clamp(0px, 8rem, 8rem)' }}>
        <DialogHeader>
          <DialogTitle className="text-center text-base">Session complete 🎉</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {hasCategory && (
            <p className="text-center text-sm text-muted-foreground">
              How was your{' '}
              <span className="font-medium text-foreground">{config.categoryName}</span> session?
            </p>
          )}
          {!hasCategory && hasTask && (
            <p className="text-center text-sm text-muted-foreground">Great work on your session!</p>
          )}

          {hasCategory && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                Rate your session
              </p>
              <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className="relative cursor-pointer p-1"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setHovered(e.clientX - rect.left < rect.width / 2 ? star - 0.5 : star)
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setRating(e.clientX - rect.left < rect.width / 2 ? star - 0.5 : star)
                    }}
                  >
                    <StarIcon fill={getStarFill(star)} />
                  </div>
                ))}
              </div>
              <p className="h-4 text-xs text-muted-foreground/70">{ratingLabel}</p>
            </div>
          )}

          {hasTask && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <p className="text-sm text-center">
                Did you complete{' '}
                <span className="font-medium text-foreground">
                  &ldquo;{config?.taskTitle}&rdquo;
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
            disabled={!canSubmit || isSaving || completeTaskMutation.isPending}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Done'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
