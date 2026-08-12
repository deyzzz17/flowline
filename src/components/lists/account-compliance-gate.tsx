'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { Check, ClipboardList, Tag, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chooseListsToKeep } from '@/api/lists/actions'
import { chooseTagsToKeep } from '@/api/tags/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { List } from '@/payload-types'

interface UserTag {
  id: number
  name: string
  color: string
}

export interface ListsComplianceInfo {
  overBy: number
  limit: number
  lists: List[]
}

export interface TagsComplianceInfo {
  overBy: number
  limit: number
  tags: UserTag[]
}

type Step =
  | { kind: 'idle' }
  | { kind: 'lists'; info: ListsComplianceInfo }
  | { kind: 'tags'; info: TagsComplianceInfo }

interface AccountComplianceGateProps {
  initialListsCompliance: ListsComplianceInfo | null
  initialTagsCompliance: TagsComplianceInfo | null
}

export function AccountComplianceGate({
  initialListsCompliance,
  initialTagsCompliance,
}: AccountComplianceGateProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [step, setStep] = useState<Step>(() => {
    if (initialListsCompliance) return { kind: 'lists', info: initialListsCompliance }
    if (initialTagsCompliance) return { kind: 'tags', info: initialTagsCompliance }
    return { kind: 'idle' }
  })

  const [pendingTags] = useState(initialTagsCompliance)

  if (step.kind === 'idle') return null

  if (step.kind === 'lists') {
    const { info } = step

    return (
      <SelectionDialog
        icon={<ClipboardList className="h-4 w-4 text-violet-500" />}
        title="Choose which lists to keep"
        description={
          <>
            Your current plan allows <strong>{info.limit}</strong> active list
            {info.limit !== 1 ? 's' : ''}, but you have <strong>{info.lists.length}</strong>. Choose
            which ones to keep — the rest will be archived, not deleted. You can restore them
            anytime from Settings if you need more space.
          </>
        }
        items={info.lists.map((l) => ({
          id: l.id,
          label: l.name,
          color: l.category?.color ?? '#8b5cf6',
          badge: l.isDefault ? 'Default' : undefined,
        }))}
        limit={info.limit}
        isSubmitting={isSubmitting}
        confirmLabel="Confirm selection"
        confirmVariant="primary"
        onConfirm={async (keepIds) => {
          setIsSubmitting(true)
          try {
            const result = await chooseListsToKeep(keepIds)
            if (!result.ok) {
              toast.error('Something went wrong. Please try again.')
              return
            }

            const archivedLists = info.lists.filter((l) => !keepIds.includes(l.id))
            const isViewingArchivedList = archivedLists.some((l) => pathname === `/lists/${l.slug}`)

            toast.info('Lists updated', {
              description: `${info.lists.length - info.limit} list${info.lists.length - info.limit !== 1 ? 's' : ''} archived. You can restore any of them later from Settings.`,
            })
            queryClient.invalidateQueries({ queryKey: ['lists'] })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })

            if (isViewingArchivedList) {
              router.push('/lists/today')
            }

            if (pendingTags) {
              setStep({ kind: 'tags', info: pendingTags })
            } else {
              setStep({ kind: 'idle' })
            }
          } catch {
            toast.error('Something went wrong. Please try again.')
          } finally {
            setIsSubmitting(false)
          }
        }}
      />
    )
  }

  const { info } = step

  return (
    <SelectionDialog
      icon={<Tag className="h-4 w-4 text-violet-500" />}
      title="Choose which tags to keep"
      description={
        <>
          Your current plan allows <strong>{info.limit}</strong> custom tag
          {info.limit !== 1 ? 's' : ''}, but you have <strong>{info.tags.length}</strong>. Choose
          which ones to keep — the rest will be archived, not deleted. Tasks already using an
          archived tag keep it; you just won&apos;t be able to assign it to new tasks until
          it&apos;s restored.
        </>
      }
      items={info.tags.map((t) => ({ id: t.id, label: t.name, color: t.color }))}
      limit={info.limit}
      isSubmitting={isSubmitting}
      confirmLabel="Confirm selection"
      confirmVariant="primary"
      onConfirm={async (keepIds) => {
        setIsSubmitting(true)
        try {
          const result = await chooseTagsToKeep(keepIds)
          if (!result.ok) {
            toast.error('Something went wrong. Please try again.')
            return
          }
          toast.info('Tags updated', {
            description: `${info.tags.length - info.limit} tag${info.tags.length - info.limit !== 1 ? 's' : ''} archived. You can restore any of them later from Settings.`,
          })
          queryClient.invalidateQueries({ queryKey: ['user-tags'] })
          setStep({ kind: 'idle' })
        } catch {
          toast.error('Something went wrong. Please try again.')
        } finally {
          setIsSubmitting(false)
        }
      }}
    />
  )
}

function SelectionDialog({
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
  confirmVariant: 'primary'
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
