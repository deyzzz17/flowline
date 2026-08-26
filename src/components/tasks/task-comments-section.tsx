'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, MessageCircle, ThumbsUp, ThumbsDown, Lock, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/api'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import { useListMemberProfiles } from '@/hooks/list-members/use-member-profiles'
import { useSession } from '@/lib/auth-client'
import { useUser } from '@/contexts/user-context'
import { canComment } from '@/lib/plan-limits'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'
import { CommentInput } from './comment-input'
import { CommentContent } from './comment-content'
import { extractMentionIds } from './comment-mentions'
import { formatDistanceToNowStrict } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'
import { toast } from 'sonner'
import type { CommentEntry } from '@/api/task-comments/actions'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

function seenKey(taskId: number) {
  return `comments-seen-${taskId}`
}

function getLastSeen(taskId: number): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(seenKey(taskId))
  } catch {
    return null
  }
}

function markSeen(taskId: number) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(seenKey(taskId), new Date().toISOString())
  } catch {}
}

interface TaskCommentsSectionProps {
  taskId: number
  listId: number
  isReader: boolean
}

export function TaskCommentsSection({ taskId, listId, isReader }: TaskCommentsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [lastSeen, setLastSeenState] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const planLimits = usePlanLimits()
  const { data: session } = useSession()
  const { user } = useUser()
  const currentUserId = session?.user?.id
  const members = useListMemberProfiles(listId, isOpen)
  const queryKey = ['task-comments', taskId]

  useEffect(() => {
    setLastSeenState(getLastSeen(taskId))
  }, [taskId])

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => api.taskComments.listForTask(taskId),
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const allowedToPost = !isReader && (!planLimits || canComment(planLimits.plan))

  const invalidate = () => queryClient.invalidateQueries({ queryKey })
  const snapshot = () => queryClient.getQueryData<CommentEntry[]>(queryKey)
  const rollback = (previous?: CommentEntry[]) => {
    if (previous) queryClient.setQueryData(queryKey, previous)
  }

  const createMutation = useMutation({
    mutationFn: (input: { content: string; parentCommentId?: number }) =>
      api.taskComments.create({
        taskId,
        content: input.content,
        parentCommentId: input.parentCommentId,
        mentions: extractMentionIds(input.content),
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = snapshot()
      const optimistic: CommentEntry = {
        id: -Date.now(),
        content: input.content,
        author: {
          id: currentUserId ?? '',
          name: user.name,
          email: user.email,
          image: user.image,
        },
        mentions: extractMentionIds(input.content),
        likeCount: 0,
        dislikeCount: 0,
        likedByMe: false,
        dislikedByMe: false,
        isMine: true,
        parentCommentId: input.parentCommentId ?? null,
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<CommentEntry[]>(queryKey, (old) => [...(old ?? []), optimistic])
      return { previous }
    },
    onError: (_e, _input, ctx) => {
      rollback(ctx?.previous)
      toast.error('Could not post your comment')
    },
    onSuccess: (result, _input, ctx) => {
      if (!result.ok) {
        rollback(ctx?.previous)
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

  const editMutation = useMutation({
    mutationFn: (input: { commentId: number; content: string }) =>
      api.taskComments.edit({
        commentId: input.commentId,
        content: input.content,
        mentions: extractMentionIds(input.content),
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = snapshot()
      queryClient.setQueryData<CommentEntry[]>(queryKey, (old) =>
        old?.map((c) =>
          c.id === input.commentId
            ? { ...c, content: input.content, mentions: extractMentionIds(input.content) }
            : c,
        ),
      )
      return { previous }
    },
    onError: (_e, _input, ctx) => {
      rollback(ctx?.previous)
      toast.error('Could not update your comment')
    },
    onSuccess: (result, _input, ctx) => {
      if (!result.ok) {
        rollback(ctx?.previous)
        toast.error('Could not update your comment')
        return
      }
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => api.taskComments.delete(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = snapshot()
      queryClient.setQueryData<CommentEntry[]>(queryKey, (old) =>
        old?.filter((c) => c.id !== commentId && c.parentCommentId !== commentId),
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      rollback(ctx?.previous)
      toast.error('Could not delete your comment')
    },
    onSuccess: (result, _id, ctx) => {
      if (!result.ok) {
        rollback(ctx?.previous)
        toast.error('Could not delete your comment')
        return
      }
      invalidate()
    },
  })

  const likeMutation = useMutation({
    mutationFn: (commentId: number) => api.taskComments.toggleLike(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = snapshot()
      queryClient.setQueryData<CommentEntry[]>(queryKey, (old) =>
        old?.map((c) => {
          if (c.id !== commentId) return c
          if (c.likedByMe) return { ...c, likedByMe: false, likeCount: c.likeCount - 1 }
          return {
            ...c,
            likedByMe: true,
            likeCount: c.likeCount + 1,
            dislikedByMe: false,
            dislikeCount: c.dislikedByMe ? c.dislikeCount - 1 : c.dislikeCount,
          }
        }),
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => rollback(ctx?.previous),
    onSuccess: (result, _id, ctx) => {
      if (!result.ok) rollback(ctx?.previous)
    },
  })

  const dislikeMutation = useMutation({
    mutationFn: (commentId: number) => api.taskComments.toggleDislike(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = snapshot()
      queryClient.setQueryData<CommentEntry[]>(queryKey, (old) =>
        old?.map((c) => {
          if (c.id !== commentId) return c
          if (c.dislikedByMe) return { ...c, dislikedByMe: false, dislikeCount: c.dislikeCount - 1 }
          return {
            ...c,
            dislikedByMe: true,
            dislikeCount: c.dislikeCount + 1,
            likedByMe: false,
            likeCount: c.likedByMe ? c.likeCount - 1 : c.likeCount,
          }
        }),
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => rollback(ctx?.previous),
    onSuccess: (result, _id, ctx) => {
      if (!result.ok) rollback(ctx?.previous)
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

  const hasUnseenMention =
    !isOpen &&
    !!currentUserId &&
    comments.some(
      (c) =>
        !c.isMine &&
        c.mentions.includes(currentUserId) &&
        (!lastSeen || new Date(c.createdAt) > new Date(lastSeen)),
    )

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (!next) {
        markSeen(taskId)
        setLastSeenState(new Date().toISOString())
      }
      return next
    })
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

  const startEdit = (comment: CommentEntry) => {
    setEditingId(comment.id)
    setEditDraft(comment.content)
  }

  const submitEdit = (commentId: number) => {
    if (!editDraft.trim()) return
    editMutation.mutate({ commentId, content: editDraft.trim() })
    setEditingId(null)
  }

  const renderComment = (comment: CommentEntry, isReply: boolean) => (
    <div key={comment.id} className={cn('flex gap-2', isReply && 'ml-8 mt-2')}>
      <Avatar className="h-6 w-6 shrink-0 mt-0.5">
        <AvatarImage src={comment.author.image ?? undefined} alt={comment.author.name} />
        <AvatarFallback className="bg-violet-500/15 text-[9px] font-semibold text-violet-600 dark:text-violet-400">
          {getInitials(comment.author.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 group">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-semibold text-foreground">{comment.author.name}</span>
          <span className="text-[10px] text-muted-foreground/60">
            {formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          {comment.isMine && editingId !== comment.id && (
            <span className="ml-auto hidden items-center gap-2 group-hover:flex">
              <button
                type="button"
                onClick={() => startEdit(comment)}
                className="text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your comment
                      {(repliesByParent.get(comment.id)?.length ?? 0) > 0
                        ? ' and its replies'
                        : ''}
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate(comment.id)}
                      variant="destructive"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </span>
          )}
        </div>

        {editingId === comment.id ? (
          <div className="mt-1">
            <CommentInput
              value={editDraft}
              onChange={setEditDraft}
              members={members}
              onSubmit={() => submitEdit(comment.id)}
              isSubmitting={editMutation.isPending}
              onCancel={() => setEditingId(null)}
              autoFocus
            />
          </div>
        ) : (
          <CommentContent text={comment.content} className="mt-0.5" />
        )}

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
        onClick={toggleOpen}
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium transition-colors',
          hasUnseenMention
            ? 'text-violet-600 dark:text-violet-400'
            : 'text-muted-foreground/70 hover:text-foreground',
        )}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Comments{comments.length > 0 ? ` (${comments.length})` : ''}
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
                {isReader ? (
                  'Readers can view and react to comments, but only editors and admins can post one.'
                ) : (
                  <>
                    <Link
                      href="/billing"
                      className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
                    >
                      Upgrade to Plus or Pro
                    </Link>{' '}
                    to post comments. You can still like and dislike them.
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
