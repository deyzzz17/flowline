'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Check,
  Loader2,
  Clock,
  BarChart2,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTimerCustomize } from '@/hooks/timer/use-timer-customize'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

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

const PRESET_COLORS = [
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#10b981',
  '#84cc16',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
  '#8b5cf6',
  '#14b8a6',
  '#64748b',
]

interface TimerCustomizeDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export const TimerCustomizeDialog = ({ open, onOpenChange }: TimerCustomizeDialogProps) => {
  const {
    session,
    update,
    analyticsOpen,
    setAnalyticsOpen,
    categories,
    showNewCategory,
    setShowNewCategory,
    newCategoryName,
    setNewCategoryName,
    newCategoryColor,
    setNewCategoryColor,
    handleCreateCategory,
    handleSubmit,
    deleteCategoryMutation,
    isValid,
    breakRequired,
    workExceedsSession,
    breakExceedsSession,
    createCategoryMutation,
  } = useTimerCustomize()

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    enabled: open && analyticsOpen,
    staleTime: 30_000,
  })
  const activeTasks = (tasksData?.docs ?? []).filter((t) => t.status === 'active')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-500" />
            Customize session
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-1">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Session
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session-duration" className="text-sm">
                Session duration <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="session-duration"
                  type="number"
                  min={1}
                  value={session.sessionDuration}
                  onChange={(e) =>
                    update('sessionDuration', e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 90"
                  className="h-10"
                />
                <span className="shrink-0 text-sm text-muted-foreground">min</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="work-duration" className="text-sm">
                Work duration
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">Optional</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="work-duration"
                  type="number"
                  min={1}
                  value={session.workDuration}
                  onChange={(e) =>
                    update('workDuration', e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 25"
                  className={cn(
                    'h-10',
                    workExceedsSession && 'border-destructive focus-visible:ring-destructive',
                  )}
                />
                <span className="shrink-0 text-sm text-muted-foreground">min</span>
              </div>
              {workExceedsSession && (
                <p className="text-xs text-destructive">Work duration exceeds session duration.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="break-duration" className="text-sm">
                Break duration
                {breakRequired ? (
                  <span className="ml-1.5 text-destructive text-xs">*</span>
                ) : (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">Optional</span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="break-duration"
                  type="number"
                  min={1}
                  value={session.breakDuration}
                  onChange={(e) =>
                    update('breakDuration', e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 5"
                  className={cn(
                    'h-10',
                    breakExceedsSession && 'border-destructive focus-visible:ring-destructive',
                  )}
                />
                <span className="shrink-0 text-sm text-muted-foreground">min</span>
              </div>
              {breakRequired && (
                <p className="text-xs text-muted-foreground">
                  Required because work time is shorter than session.
                </p>
              )}
              {breakExceedsSession && (
                <p className="text-xs text-destructive">Break duration exceeds session duration.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setAnalyticsOpen(!analyticsOpen)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Analytics
                </span>
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
                  Optional
                </span>
              </div>
              {analyticsOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </button>

            {analyticsOpen && (
              <div className="border-t border-border/40 px-4 py-4 space-y-5 bg-muted/10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fill these fields to track your sessions in Analytics.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <Label className="text-sm">Category</Label>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => {
                      const isSelected = session.categoryId === String(cat.id)
                      return (
                        <div key={cat.id} className="flex items-center group">
                          <button
                            type="button"
                            onClick={() => update('categoryId', isSelected ? '' : String(cat.id))}
                            className="flex items-center gap-1.5 rounded-l-full border-y border-l px-2.5 py-1 text-xs font-medium transition-all"
                            style={
                              isSelected
                                ? {
                                    backgroundColor: hexToRgba(cat.color, 0.15),
                                    borderColor: hexToRgba(cat.color, 0.5),
                                    color: cat.color,
                                  }
                                : undefined
                            }
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </button>
                          {!cat.isDefault && (
                            <button
                              type="button"
                              onClick={() => deleteCategoryMutation.mutate(cat.id)}
                              className="flex items-center justify-center h-full rounded-r-full border-y border-r px-1.5 py-1 border-border/60 bg-background text-muted-foreground hover:text-destructive transition-colors"
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: hexToRgba(cat.color, 0.15),
                                      borderColor: hexToRgba(cat.color, 0.5),
                                      color: cat.color,
                                    }
                                  : undefined
                              }
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                          {cat.isDefault && (
                            <div className="flex items-center justify-center h-full rounded-r-full border-y border-r border-border/60 bg-background px-1.5 py-1" />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {showNewCategory ? (
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">New category</p>
                        <button
                          type="button"
                          onClick={() => setShowNewCategory(false)}
                          className="text-muted-foreground/50 hover:text-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name..."
                        className="h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateCategory()
                          }
                        }}
                      />
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          Color
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewCategoryColor(c)}
                              className="h-6 w-6 rounded-full transition-all hover:scale-110"
                              style={{
                                backgroundColor: c,
                                ...(newCategoryColor === c && {
                                  outline: `2px solid ${c}`,
                                  outlineOffset: '2px',
                                }),
                              }}
                            />
                          ))}
                          <div className="relative">
                            <div
                              className="h-6 w-6 rounded-full border-2 border-dashed border-border/60 cursor-pointer overflow-hidden"
                              style={{
                                backgroundColor: PRESET_COLORS.includes(newCategoryColor)
                                  ? 'transparent'
                                  : newCategoryColor,
                              }}
                            />
                            <input
                              type="color"
                              value={newCategoryColor}
                              onChange={(e) => setNewCategoryColor(e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-all hover:bg-foreground/80 disabled:opacity-40"
                      >
                        {createCategoryMutation.isPending ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            Create category
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      className="flex items-center gap-1.5 rounded-full border border-dashed border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-all hover:border-border hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                      New category
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sub-category" className="text-sm">
                    Sub-category
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      Optional
                    </span>
                  </Label>
                  <Input
                    id="sub-category"
                    value={session.subCategory}
                    onChange={(e) => update('subCategory', e.target.value)}
                    placeholder="e.g. Frontend, Cardio..."
                    className={cn(
                      'h-10',
                      session.subCategory && !session.categoryId && 'border-destructive',
                    )}
                  />
                  {session.subCategory && !session.categoryId && (
                    <p className="text-xs text-destructive">
                      A category is required for sub-category.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="task" className="text-sm">
                    Linked task
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      Optional
                    </span>
                  </Label>
                  <select
                    id="task"
                    value={session.taskId ?? ''}
                    onChange={(e) =>
                      update('taskId', e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 transition-colors"
                  >
                    <option value="">No task</option>
                    {activeTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid} className="gap-2">
              <Check className="h-3.5 w-3.5" />
              Start session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
