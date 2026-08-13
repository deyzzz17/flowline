'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, Tag } from 'lucide-react'
import { chooseListsToKeep } from '@/api/lists/actions'
import { chooseTagsToKeep } from '@/api/tags/actions'
import { PlanSelectionDialog } from '@/components/ui/plan-selection-dialog'
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
      <PlanSelectionDialog
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
    <PlanSelectionDialog
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
