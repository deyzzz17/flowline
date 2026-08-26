'use server'

import 'server-only'

import { getPayload } from 'payload'
import type { BasePayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { ok, err } from '@/types/result'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/get-session'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { resolveListRole, canViewList, canEditListContent, getListMemberIds } from '@/lib/list-roles'
import { canComment } from '@/lib/plan-limits'
import { findUsersByIds, type ContactProfile } from '@/api/contacts/actions'
import type { List, Task } from '@/payload-types'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export interface CommentEntry {
  id: number
  content: string
  author: ContactProfile
  mentions: string[]
  likeCount: number
  dislikeCount: number
  likedByMe: boolean
  dislikedByMe: boolean
  isMine: boolean
  parentCommentId: number | null
  createdAt: string
}

async function getTaskListContext(
  payload: BasePayload,
  taskId: number,
): Promise<{ task: Task; list: List; listId: number } | null> {
  const task = await payload.findByID({ collection: 'tasks', id: taskId }).catch(() => null)
  if (!task || !task.list) return null
  const listId = typeof task.list === 'object' ? task.list.id : task.list
  const list = await payload.findByID({ collection: 'lists', id: listId }).catch(() => null)
  if (!list) return null
  return { task, list, listId }
}

export const listCommentsForTask = async (taskId: number): Promise<CommentEntry[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })
  const ctx = await getTaskListContext(payload, taskId)
  if (!ctx || !ctx.list.isShared) return []

  const role = await resolveListRole(payload, ctx.listId, userId)
  if (!canViewList(role)) return []

  const { docs } = await payload.find({
    collection: 'task-comments',
    where: { task: { equals: taskId } },
    sort: 'createdAt',
    limit: 0,
  })

  if (docs.length === 0) return []

  const authorsMap = await findUsersByIds(docs.map((d) => d.userId as string))

  return docs
    .map((d) => {
      const author = authorsMap.get(d.userId as string)
      if (!author) return null
      const likes = (d.likes ?? []) as string[]
      const dislikes = (d.dislikes ?? []) as string[]
      const parentCommentId =
        typeof d.parentComment === 'object'
          ? (d.parentComment?.id ?? null)
          : (d.parentComment ?? null)
      return {
        id: d.id,
        content: d.content,
        author,
        mentions: (d.mentions ?? []) as string[],
        likeCount: likes.length,
        dislikeCount: dislikes.length,
        likedByMe: likes.includes(userId),
        dislikedByMe: dislikes.includes(userId),
        isMine: d.userId === userId,
        parentCommentId,
        createdAt: d.createdAt as string,
      }
    })
    .filter((c): c is CommentEntry => c !== null)
}

export type CreateCommentInput = {
  taskId: number
  content: string
  parentCommentId?: number
  mentions?: string[]
}

export const createComment = async (input: CreateCommentInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`create-comment:${userId}`, 1, 1000)) {
      return err('Too many requests. Please wait a moment.')
    }

    const content = input.content.trim()
    if (!content) return err('Comment cannot be empty')

    const payload = await getPayload({ config })
    const ctx = await getTaskListContext(payload, input.taskId)
    if (!ctx) return err('Task not found')
    if (!ctx.list.isShared) return err('Comments are only available on shared lists')

    // Commenting is content creation, not just viewing — readers can read and
    // react to comments, but only editors and admins can post one.
    const role = await resolveListRole(payload, ctx.listId, userId)
    if (!canEditListContent(role)) return err('Not authorized')

    const { plan } = await getPlanLimitsForUserId(userId)
    if (!canComment(plan)) return err('COMMENTS_REQUIRE_PAID_PLAN')

    if (input.parentCommentId) {
      const parent = await payload
        .findByID({ collection: 'task-comments', id: input.parentCommentId })
        .catch(() => null)
      const parentTaskId = typeof parent?.task === 'object' ? parent?.task?.id : parent?.task
      if (!parent || parentTaskId !== input.taskId) return err('Comment not found')
    }

    const mentions = Array.from(new Set(input.mentions ?? []))
    if (mentions.length > 0) {
      const memberIds = await getListMemberIds(payload, ctx.listId)
      const invalid = mentions.find((id) => !memberIds.includes(id))
      if (invalid) return err('You can only mention members of this list.')
    }

    const comment = await payload.create({
      collection: 'task-comments',
      data: {
        task: input.taskId,
        userId,
        content,
        ...(input.parentCommentId && { parentComment: input.parentCommentId }),
        mentions,
      },
    })

    revalidatePath('/')
    return ok(comment)
  } catch {
    return err('Error while posting the comment')
  }
}

async function getCommentListContext(payload: BasePayload, commentId: number) {
  const comment = await payload
    .findByID({ collection: 'task-comments', id: commentId })
    .catch(() => null)
  if (!comment) return null
  const taskId = typeof comment.task === 'object' ? comment.task.id : comment.task
  const ctx = await getTaskListContext(payload, taskId)
  if (!ctx) return null
  return { comment, ...ctx }
}

export const toggleCommentLike = async (commentId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const ctx = await getCommentListContext(payload, commentId)
    if (!ctx) return err('Comment not found')

    const role = await resolveListRole(payload, ctx.listId, userId)
    if (!canViewList(role)) return err('Not authorized')

    const likes = new Set((ctx.comment.likes ?? []) as string[])
    const dislikes = new Set((ctx.comment.dislikes ?? []) as string[])
    if (likes.has(userId)) {
      likes.delete(userId)
    } else {
      likes.add(userId)
      dislikes.delete(userId)
    }

    await payload.update({
      collection: 'task-comments',
      id: commentId,
      data: { likes: Array.from(likes), dislikes: Array.from(dislikes) },
    })

    revalidatePath('/')
    return ok({
      likeCount: likes.size,
      dislikeCount: dislikes.size,
      likedByMe: likes.has(userId),
      dislikedByMe: dislikes.has(userId),
    })
  } catch {
    return err('Error while updating the comment')
  }
}

export const toggleCommentDislike = async (commentId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const ctx = await getCommentListContext(payload, commentId)
    if (!ctx) return err('Comment not found')

    const role = await resolveListRole(payload, ctx.listId, userId)
    if (!canViewList(role)) return err('Not authorized')

    const likes = new Set((ctx.comment.likes ?? []) as string[])
    const dislikes = new Set((ctx.comment.dislikes ?? []) as string[])
    if (dislikes.has(userId)) {
      dislikes.delete(userId)
    } else {
      dislikes.add(userId)
      likes.delete(userId)
    }

    await payload.update({
      collection: 'task-comments',
      id: commentId,
      data: { likes: Array.from(likes), dislikes: Array.from(dislikes) },
    })

    revalidatePath('/')
    return ok({
      likeCount: likes.size,
      dislikeCount: dislikes.size,
      likedByMe: likes.has(userId),
      dislikedByMe: dislikes.has(userId),
    })
  } catch {
    return err('Error while updating the comment')
  }
}

export type EditCommentInput = {
  commentId: number
  content: string
  mentions?: string[]
}

export const editComment = async (input: EditCommentInput) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const content = input.content.trim()
    if (!content) return err('Comment cannot be empty')

    const payload = await getPayload({ config })
    const ctx = await getCommentListContext(payload, input.commentId)
    if (!ctx) return err('Comment not found')
    if (ctx.comment.userId !== userId) return err('Not authorized')

    const role = await resolveListRole(payload, ctx.listId, userId)
    if (!canEditListContent(role)) return err('Not authorized')

    const { plan } = await getPlanLimitsForUserId(userId)
    if (!canComment(plan)) return err('COMMENTS_REQUIRE_PAID_PLAN')

    const mentions = Array.from(new Set(input.mentions ?? []))
    if (mentions.length > 0) {
      const memberIds = await getListMemberIds(payload, ctx.listId)
      const invalid = mentions.find((id) => !memberIds.includes(id))
      if (invalid) return err('You can only mention members of this list.')
    }

    const comment = await payload.update({
      collection: 'task-comments',
      id: input.commentId,
      data: { content, mentions },
    })

    revalidatePath('/')
    return ok(comment)
  } catch {
    return err('Error while editing the comment')
  }
}

export const deleteComment = async (commentId: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const ctx = await getCommentListContext(payload, commentId)
    if (!ctx) return err('Comment not found')
    if (ctx.comment.userId !== userId) return err('Not authorized')

    // Comments only nest one level deep, so a single pass is enough to
    // clean up any replies left dangling under the deleted comment.
    const { docs: replies } = await payload.find({
      collection: 'task-comments',
      where: { parentComment: { equals: commentId } },
      limit: 0,
    })
    for (const reply of replies) {
      await payload.delete({ collection: 'task-comments', id: reply.id })
    }

    await payload.delete({ collection: 'task-comments', id: commentId })

    revalidatePath('/')
    return ok(true)
  } catch {
    return err('Error while deleting the comment')
  }
}

export interface CommentMentionNotification {
  commentId: number
  taskId: number
  taskTitle: string
  listSlug: string
  listColor: string
  authorName: string
  authorImage: string | null
  createdAt: string
}

export const listMyCommentMentionNotifications = async (): Promise<
  CommentMentionNotification[]
> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })

  // hasMany text fields don't reliably support a DB-level "array contains"
  // filter across adapters, so we scan the most recent comments authored by
  // others and filter the mentions client-side here instead.
  const { docs } = await payload.find({
    collection: 'task-comments',
    where: { userId: { not_equals: userId } },
    sort: '-createdAt',
    limit: 200,
  })

  const mentioning = docs.filter((d) => ((d.mentions ?? []) as string[]).includes(userId))
  if (mentioning.length === 0) return []

  const authorsMap = await findUsersByIds(mentioning.map((d) => d.userId as string))

  const result: CommentMentionNotification[] = []
  for (const d of mentioning) {
    const taskId = typeof d.task === 'object' ? d.task?.id : d.task
    if (!taskId) continue
    const ctx = await getTaskListContext(payload, taskId)
    if (!ctx) continue

    const role = await resolveListRole(payload, ctx.listId, userId)
    if (!canViewList(role)) continue

    const author = authorsMap.get(d.userId as string)
    result.push({
      commentId: d.id,
      taskId,
      taskTitle: ctx.task.title,
      listSlug: ctx.list.slug ?? '',
      listColor: ctx.list.category?.color ?? '#8b5cf6',
      authorName: author?.name ?? 'Someone',
      authorImage: author?.image ?? null,
      createdAt: d.createdAt as string,
    })
  }

  return result
}

export async function deleteCommentsForTaskIds(taskIds: number[]): Promise<void> {
  if (taskIds.length === 0) return
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'task-comments',
      where: { task: { in: taskIds } },
      limit: 0,
    })
    for (const comment of docs) {
      await payload.delete({ collection: 'task-comments', id: comment.id })
    }
  } catch (e) {
    console.error('deleteCommentsForTaskIds error:', e)
  }
}
