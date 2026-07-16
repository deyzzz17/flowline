'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateList } from '@/hooks/lists/use-create-list'
import { toast } from 'sonner'
import { LIMIT_ERRORS } from '@/lib/plan-limits'
import { PlanLimitDialog } from '@/components/ui/plan-limit-dialog'

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
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#10b981',
  '#84cc16',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#64748b',
]

export const NewListClient = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    name,
    setName,
    categoryName,
    setCategoryName,
    color,
    setColor,
    error,
    setError,
    limitOpen,
    setLimitOpen,
  } = useCreateList()

  const mutation = useMutation({
    mutationFn: () =>
      api.lists.create({
        name: name.trim(),
        category: {
          name: categoryName.trim() || undefined,
          color,
        },
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        if (result.error === LIMIT_ERRORS.LISTS_LIMIT) {
          setLimitOpen(true)
          return
        }
        setError(
          result.error === 'DUPLICATE_NAME'
            ? `A list named "${name.trim()}" already exists. Please choose a different name.`
            : 'Something went wrong while creating the list. Please try again.',
        )
        return
      }
      toast.info('List created', {
        description: `Your list is successfully created.`,
      })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      router.push(`/lists/${result.value.slug}`)
    },
    onError: () => {
      toast.error('Error while creating the list', {
        description: `Something went wrong while creating the list. Please try again.`,
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    setError(null)
    mutation.mutate()
  }

  return (
    <div className="mx-auto max-w-lg mt-10">
      <div className="mb-8">
        <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
          Lists
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">New list</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Create a new list to organize your tasks.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="e.g. Work, Personal, Shopping..."
              className={cn(
                'h-11 transition-all',
                error &&
                  !name.trim() &&
                  'border-destructive focus-visible:ring-destructive bg-destructive/5',
              )}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category{' '}
              <span className="text-xs font-normal text-muted-foreground ml-1">Optional</span>
            </Label>
            <Input
              id="category"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Work, Health, Finance..."
              className="h-11"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    color === c ? 'scale-110' : 'hover:scale-105',
                  )}
                  style={{
                    backgroundColor: c,
                    ...(color === c && {
                      outline: `3px solid ${c}`,
                      outlineOffset: '2px',
                    }),
                  }}
                />
              ))}
              <div className="relative">
                <div
                  className="h-8 w-8 rounded-full border-2 border-dashed border-border/60 cursor-pointer overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: PRESET_COLORS.includes(color) ? 'transparent' : color }}
                />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                />
              </div>
            </div>

            <div
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium"
              style={{
                backgroundColor: hexToRgba(color, 0.1),
                borderColor: hexToRgba(color, 0.3),
                color,
              }}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {name || 'Preview'}
              {categoryName && <span className="text-xs opacity-70">· {categoryName}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className="gap-2 bg-violet-600 hover:bg-violet-500 px-8"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Create list
              </>
            )}
          </Button>
        </div>
      </form>

      <PlanLimitDialog
        open={limitOpen}
        onOpenChange={setLimitOpen}
        limitError={LIMIT_ERRORS.LISTS_LIMIT}
      />
    </div>
  )
}
