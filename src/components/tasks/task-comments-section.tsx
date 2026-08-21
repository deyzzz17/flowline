'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, MessageCircle, ThumbsUp, ThumbsDown, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/api'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import { useListMemberProfiles } from '@/hooks/list-members/use-member-profiles'
import { canComment } from '@/lib/plan-limits'
import { CommentInput } from './comment-input'
import { CommentContent } from './comment-content'
import { extractMentionIds } from './comment-mentions'
import { formatDistanceToNowStrict } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { toast } from 'sonner'
import type { CommentEntry } from '@/api/task-comments/actions'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

interface TaskCommentsSectionProps {
  taskId: number
  listId: number
}

export function TaskCommentsSection({ taskId, listId }: TaskCommentsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const queryClient = useQueryClient()
  const planLimits = usePlanLimits()
  const members = useListMemberProfiles(listId, isOpen)

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => api.taskComments.listForTask(taskId),
    enabled: isOpen,
  })

  const allowedToPost = !planLimits || canComment(planLimits.plan)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })

  const createMutation = useMutation({
    mutationFn: (input: { content: string; parentCommentId?: number }) =>
      api.taskComments.create({
        taskId,
        content: input.content,
        parentCommentId: input.parentCommentId,
        mentions: extractMentionIds(input.content),
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error('Could not post your comment', {
          description:
            result.error === 'COMMENTS_REQUIRE_PAID_PLAN'
              ? 'Comments are a Plus/Pro feature.'
              : undefined,
        })
        return
      }
      invalidate()
    },
  })

  const likeMutation = useMutation({
    mutationFn: (commentId: number) => api.taskComments.toggleLike(commentId),
    onSuccess: (result) => {
      if (result.ok) invalidate()
    },
  })

  const dislikeMutation = useMutation({
    mutationFn: (commentId: number) => api.taskComments.toggleDislike(commentId),
    onSuccess: (result) => {
      if (result.ok) invalidate()
    },
  })

  const topLevel = comments.filter((c) => c.parentCommentId === null)
  const repliesByParent = new Map<number, CommentEntry[]>()
  for (const c of comments) {
    if (c.parentCommentId !== null) {
      const list = repliesByParent.get(c.parentCommentId) ?? []
      list.push(c)
      repliesByParent.set(c.parentCommentId, list)
    }
  }

  const submitTopLevel = () => {
    if (!draft.trim()) return
    createMutation.mutate({ content: draft.trim() })
    setDraft('')
  }

  const submitReply = (parentId: number) => {
    if (!replyDraft.trim()) return
    createMutation.mutate({ content: replyDraft.trim(), parentCommentId: parentId })
    setReplyDraft('')
    setReplyTo(null)
  }

  const renderComment = (comment: CommentEntry, isReply: boolean) => (
    <div key={comment.id} className={cn('flex gap-2', isReply && 'ml-8 mt-2')}>
      <Avatar className="h-6 w-6 shrink-0 mt-0.5">
        <AvatarImage src={comment.author.image ?? undefined} alt={comment.author.name} />
        <AvatarFallback className="bg-violet-500/15 text-[9px] font-semibold text-violet-600 dark:text-violet-400">
          {getInitials(comment.author.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-semibold text-foreground">{comment.author.name}</span>
          <span className="text-[10px] text-muted-foreground/60">
            {formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <CommentContent text={comment.content} className="mt-0.5" />
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={() => likeMutation.mutate(comment.id)}
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium transition-colors',
              comment.likedByMe
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-muted-foreground/60 hover:text-foreground',
            )}
          >
            <ThumbsUp className="h-3 w-3" />
            {comment.likeCount > 0 && comment.likeCount}
          </button>
          <button
            type="button"
            onClick={() => dislikeMutation.mutate(comment.id)}
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium transition-colors',
              comment.dislikedByMe ? 'text-destructive' : 'text-muted-foreground/60 hover:text-foreground',
            )}
          >
            <ThumbsDown className="h-3 w-3" />
            {comment.dislikeCount > 0 && comment.dislikeCount}
          </button>
          {!isReply && allowedToPost && (
            <button
              type="button"
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="text-[11px] font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {replyTo === comment.id && (
          <div className="mt-2">
            <CommentInput
              value={replyDraft}
              onChange={setReplyDraft}
              members={members}
              placeholder={`Reply to ${comment.author.name}...`}
              onSubmit={() => submitReply(comment.id)}
              isSubmitting={createMutation.isPending}
              onCancel={() => setReplyTo(null)}
              autoFocus
            />
          </div>
        )}

        {(repliesByParent.get(comment.id) ?? []).map((reply) => renderComment(reply, true))}
      </div>
    </div>
  )

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Comments{isOpen && comments.length > 0 ? ` (${comments.length})` : ''}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3 rounded-xl border border-border/40 bg-muted/10 p-3">
          {isLoading && <p className="text-xs text-muted-foreground">Loading comments...</p>}

          {!isLoading && topLevel.length === 0 && (
            <p className="text-xs text-muted-foreground">No comments yet.</p>
          )}

          <div className="space-y-3">{topLevel.map((c) => renderComment(c, false))}</div>

          {allowedToPost ? (
            <CommentInput
              value={draft}
              onChange={setDraft}
              members={members}
              onSubmit={submitTopLevel}
              isSubmitting={createMutation.isPending}
            />
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <span>
                <Link
                  href="/billing"
                  className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
                >
                  Upgrade to Plus or Pro
                </Link>{' '}
                to post comments. You can still like and dislike them.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
