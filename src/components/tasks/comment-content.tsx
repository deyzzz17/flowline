'use client'

import { parseCommentMentions } from './comment-mentions'
import { cn } from '@/lib/utils'

export function CommentContent({ text, className }: { text: string; className?: string }) {
  const parts = parseCommentMentions(text)

  return (
    <p className={cn('text-sm text-foreground whitespace-pre-wrap break-words', className)}>
      {parts.map((part, i) =>
        part.type === 'mention' ? (
          <span
            key={i}
            className="rounded-md bg-violet-500/10 px-1 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400"
          >
            @{part.content}
          </span>
        ) : (
          <span key={i}>{part.content}</span>
        ),
      )}
    </p>
  )
}
