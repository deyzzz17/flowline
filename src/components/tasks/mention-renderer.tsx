'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { parseMentions } from './mention-textarea'
import { cn } from '@/lib/utils'

interface MentionRendererProps {
  text: string
  className?: string
}

export const MentionRenderer = ({ text, className }: MentionRendererProps) => {
  const router = useRouter()
  const parts = parseMentions(text)
  const hasMentions = parts.some((p) => p.type === 'mention')

  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    enabled: hasMentions,
    staleTime: 30_000,
  })

  const handleMentionClick = (taskId: number) => {
    if (!data?.docs) return

    let targetTask = data.docs.find((t) => t.id === taskId)

    if (!targetTask) {
      const parentId = Math.floor(taskId / 10000)
      targetTask = data.docs.find((t) => t.id === parentId)
    }

    if (!targetTask) return

    type ListObj = { slug: string }
    const list =
      targetTask.list && typeof targetTask.list === 'object' ? (targetTask.list as ListObj) : null

    if (list?.slug) {
      router.push(`/lists/${list.slug}`)
    }
  }

  return (
    <p
      className={cn('text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap', className)}
    >
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.content}</span>
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
  )
}
