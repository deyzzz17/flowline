'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, Tag, Users, Building2 } from 'lucide-react'
import { chooseListsToKeep } from '@/api/lists/actions'
import { chooseSharedListsToKeep } from '@/api/list-members/actions'
import { chooseTagsToKeep } from '@/api/tags/actions'
import {
  chooseWorkspaceMembersToKeep,
  type WorkspaceMembersComplianceInfo,
} from '@/api/workspaces/actions'
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

export interface SharedListsComplianceInfo {
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
  | { kind: 'sharedLists'; info: SharedListsComplianceInfo }
  | { kind: 'tags'; info: TagsComplianceInfo }
  // A user can own several workspaces at once, each independently over its
  // new member limit — queue holds the ones not yet resolved, current one
  // first.
  | { kind: 'workspaceMembers'; queue: WorkspaceMembersComplianceInfo[] }

interface AccountComplianceGateProps {
  initialListsCompliance: ListsComplianceInfo | null
  initialSharedListsCompliance: SharedListsComplianceInfo | null
  initialTagsCompliance: TagsComplianceInfo | null
  initialWorkspaceMembersCompliance: WorkspaceMembersComplianceInfo[]
}

export function AccountComplianceGate({
  initialListsCompliance,
  initialSharedListsCompliance,
  initialTagsCompliance,
  initialWorkspaceMembersCompliance,
}: AccountComplianceGateProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [step, setStep] = useState<Step>(() => {
    if (initialListsCompliance) return { kind: 'lists', info: initialListsCompliance }
    if (initialSharedListsCompliance)
      return { kind: 'sharedLists', info: initialSharedListsCompliance }
    if (initialTagsCompliance) return { kind: 'tags', info: initialTagsCompliance }
    if (initialWorkspaceMembersCompliance.length > 0)
      return { kind: 'workspaceMembers', queue: initialWorkspaceMembersCompliance }
    return { kind: 'idle' }
  })

  const [pendingSharedLists] = useState(initialSharedListsCompliance)
  const [pendingTags] = useState(initialTagsCompliance)
  const [pendingWorkspaceMembers] = useState(initialWorkspaceMembersCompliance)

  const advanceToWorkspaceMembersOrIdle = () => {
    if (pendingWorkspaceMembers.length > 0) {
      setStep({ kind: 'workspaceMembers', queue: pendingWorkspaceMembers })
    } else {
      setStep({ kind: 'idle' })
    }
  }

  const advanceAfterLists = () => {
    if (pendingSharedLists) {
      setStep({ kind: 'sharedLists', info: pendingSharedLists })
    } else if (pendingTags) {
      setStep({ kind: 'tags', info: pendingTags })
    } else {
      advanceToWorkspaceMembersOrIdle()
    }
  }

  // A limit of 0 (shared lists on the free plan) means there is nothing to
  // choose from — archive them all automatically instead of showing a dialog.
  useEffect(() => {
    if (step.kind !== 'sharedLists' || step.info.limit !== 0) return

    let cancelled = false
    setIsSubmitting(true)
    chooseSharedListsToKeep([])
      .then((result) => {
        if (cancelled) return
        if (result.ok) {
          const isViewingArchivedSharedList = step.info.lists.some(
            (l) => pathname === `/lists/${l.slug}`,
          )
          toast.info('Shared lists archived', {
            description:
              'Your plan no longer includes shared lists you administer. They were archived, not deleted — you can restore them if you upgrade again.',
          })
          queryClient.invalidateQueries({ queryKey: ['lists'] })
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          if (isViewingArchivedSharedList) {
            router.push('/lists/today')
          }
        }
        if (pendingTags) {
          setStep({ kind: 'tags', info: pendingTags })
        } else {
          advanceToWorkspaceMembersOrIdle()
        }
      })
      .finally(() => {
        if (!cancelled) setIsSubmitting(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  if (step.kind === 'idle') return null
  if (step.kind === 'sharedLists' && step.info.limit === 0) return null

  if (step.kind === 'lists') {
    const { info } = step

    return (
      <PlanSelectionDialog
        key="lists"
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

            advanceAfterLists()
          } catch {
            toast.error('Something went wrong. Please try again.')
          } finally {
            setIsSubmitting(false)
          }
        }}
      />
    )
  }

  if (step.kind === 'sharedLists') {
    const { info } = step

    return (
      <PlanSelectionDialog
        key="sharedLists"
        icon={<Users className="h-4 w-4 text-violet-500" />}
        title="Choose which shared lists to keep"
        description={
          <>
            Your current plan allows <strong>{info.limit}</strong> shared list
            {info.limit !== 1 ? 's' : ''} that you administer, but you have{' '}
            <strong>{info.lists.length}</strong>. Choose which ones to keep — the rest will be
            archived, not deleted, along with their members. You can restore them if you upgrade
            again.
          </>
        }
        items={info.lists.map((l) => ({
          id: l.id,
          label: l.name,
          color: l.category?.color ?? '#8b5cf6',
        }))}
        limit={info.limit}
        isSubmitting={isSubmitting}
        confirmLabel="Confirm selection"
        onConfirm={async (keepIds) => {
          setIsSubmitting(true)
          try {
            const result = await chooseSharedListsToKeep(keepIds)
            if (!result.ok) {
              toast.error('Something went wrong. Please try again.')
              return
            }

            const archivedLists = info.lists.filter((l) => !keepIds.includes(l.id))
            const isViewingArchivedList = archivedLists.some((l) => pathname === `/lists/${l.slug}`)

            toast.info('Shared lists updated', {
              description: `${info.lists.length - info.limit} shared list${info.lists.length - info.limit !== 1 ? 's' : ''} archived. You can restore them if you upgrade again.`,
            })
            queryClient.invalidateQueries({ queryKey: ['lists'] })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })

            if (isViewingArchivedList) {
              router.push('/lists/today')
            }

            if (pendingTags) {
              setStep({ kind: 'tags', info: pendingTags })
            } else {
              advanceToWorkspaceMembersOrIdle()
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

  if (step.kind === 'tags') {
    const { info } = step

    return (
      <PlanSelectionDialog
        key="tags"
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
            advanceToWorkspaceMembersOrIdle()
          } catch {
            toast.error('Something went wrong. Please try again.')
          } finally {
            setIsSubmitting(false)
          }
        }}
      />
    )
  }

  const { queue } = step
  const info = queue[0]

  return (
    <PlanSelectionDialog<string>
      key={`workspaceMembers-${info.workspaceId}`}
      icon={<Building2 className="h-4 w-4 text-violet-500" />}
      title={`Choose who stays in ${info.workspaceName}`}
      description={
        <>
          Your current plan allows <strong>{info.limit}</strong> other member
          {info.limit !== 1 ? 's' : ''} in this workspace (plus you, the owner), but it has{' '}
          <strong>{info.members.length}</strong>. Choose who stays — the rest will be removed from
          the workspace, not deleted from Flowline. You can bring them back anytime you have room
          again, from the workspace&apos;s Members page.
        </>
      }
      items={info.members.map((m) => ({
        id: m.userId,
        label: m.label,
        badge: m.role === 'admin' ? 'Admin' : m.role === 'viewer' ? 'Viewer' : undefined,
      }))}
      limit={info.limit}
      isSubmitting={isSubmitting}
      confirmLabel="Confirm selection"
      onConfirm={async (keepUserIds) => {
        setIsSubmitting(true)
        try {
          const result = await chooseWorkspaceMembersToKeep(info.workspaceId, keepUserIds)
          if (!result.ok) {
            toast.error('Something went wrong. Please try again.')
            return
          }
          toast.info('Workspace members updated', {
            description: `${info.members.length - info.limit} member${info.members.length - info.limit !== 1 ? 's' : ''} removed from ${info.workspaceName}. You can add them back once there's room.`,
          })
          queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
          queryClient.invalidateQueries({ queryKey: ['workspaces'] })

          const rest = queue.slice(1)
          if (rest.length > 0) {
            setStep({ kind: 'workspaceMembers', queue: rest })
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
