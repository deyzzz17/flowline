'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { parseMentions } from './mention-textarea'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MentionRendererProps {
  text: string
  className?: string
  currentListSlug?: string
}

export const MentionRenderer = ({ text, className, currentListSlug }: MentionRendererProps) => {
  const router = useRouter()
  const parts = parseMentions(text)
  const hasMentions = parts.some((p) => p.type === 'mention')
  const [highlightedId, setHighlightedId] = useState<number | null>(null)

  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    enabled: hasMentions,
    staleTime: 30_000,
  })

  const resolveTask = (taskId: number) => {
    if (!data?.docs) return { task: null, resolvedId: taskId }

    let task = data.docs.find((t) => t.id === taskId) ?? null
    let resolvedId = taskId

    if (!task) {
      const parentId = Math.floor(taskId / 10000)
      task = data.docs.find((t) => t.id === parentId) ?? null
      resolvedId = parentId
    }

    return { task, resolvedId }
  }

  const handleMentionClick = (taskId: number) => {
    const { task: targetTask, resolvedId } = resolveTask(taskId)
    if (!targetTask || targetTask.status === 'deleted') return

    type ListObj = { slug: string }
    const list =
      targetTask.list && typeof targetTask.list === 'object' ? (targetTask.list as ListObj) : null

    const isSameList = list?.slug === currentListSlug

    if (isSameList || !list?.slug) {
      const el = document.querySelector(`[data-task-id="${resolvedId}"]`) as HTMLElement | null
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedId(resolvedId)
      setTimeout(() => setHighlightedId(null), 3000)
    } else {
      router.push(`/lists/${list.slug}`)
    }
  }

  if (typeof window !== 'undefined' && !document.getElementById('mention-highlight-style')) {
    const style = document.createElement('style')
    style.id = 'mention-highlight-style'
    style.textContent = `
      @keyframes mentionHighlight {
        0%   { box-shadow: 0 0 0 0 rgba(139,92,246,0.5); background-color: rgba(139,92,246,0.08); }
        30%  { box-shadow: 0 0 0 4px rgba(139,92,246,0.2); background-color: rgba(139,92,246,0.12); }
        100% { box-shadow: 0 0 0 0 rgba(139,92,246,0); background-color: transparent; }
      }
      [data-task-id].mention-highlighted {
        animation: mentionHighlight 3s ease-out forwards;
        border-radius: 0.75rem;
      }
    `
    document.head.appendChild(style)
  }

  if (typeof window !== 'undefined') {
    document.querySelectorAll('[data-task-id].mention-highlighted').forEach((el) => {
      if (highlightedId === null || Number(el.getAttribute('data-task-id')) !== highlightedId) {
        el.classList.remove('mention-highlighted')
      }
    })
    if (highlightedId !== null) {
      const el = document.querySelector(`[data-task-id="${highlightedId}"]`)
      el?.classList.add('mention-highlighted')
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <p
        className={cn(
          'text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap',
          className,
        )}
      >
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return <span key={i}>{part.content}</span>
          }

          const { task: resolvedTask } = part.taskId ? resolveTask(part.taskId) : { task: null }
          const isDeleted = !resolvedTask || resolvedTask.status === 'deleted'

          if (isDeleted) {
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive/70 line-through cursor-not-allowed">
                    @{part.content}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  This task has been deleted
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => part.taskId && handleMentionClick(part.taskId)}
              className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors cursor-pointer"
            >
              @{part.content}
            </button>
          )
        })}
      </p>
    </TooltipProvider>
  )
}
