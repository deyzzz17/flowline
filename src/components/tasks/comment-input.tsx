'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { useCommentMentionSearch } from '@/hooks/tasks/use-comment-mention-search'
import { useIsMobile } from '@/hooks/use-mobile'
import type { ContactProfile } from '@/api/contacts/actions'
import { Loader2, Send } from 'lucide-react'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return parts[0][0].toUpperCase()
}

interface CommentInputProps {
  value: string
  onChange: (value: string) => void
  members: ContactProfile[]
  placeholder?: string
  onSubmit: () => void
  isSubmitting?: boolean
  autoFocus?: boolean
  onCancel?: () => void
}

export const CommentInput = ({
  value,
  onChange,
  members,
  placeholder,
  onSubmit,
  isSubmitting,
  autoFocus,
  onCancel,
}: CommentInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isMobile = useIsMobile()
  const resolvedPlaceholder =
    placeholder ?? (isMobile ? 'Write a comment' : 'Write a comment... use @ to mention someone')
  const { mentionSearch, selectedIndex, setSelectedIndex, filtered, openMention, closeMention, insertMention } =
    useCommentMentionSearch(members)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursor = e.target.selectionStart ?? 0
    onChange(newValue)

    const textBefore = newValue.slice(0, cursor)
    const atIndex = textBefore.lastIndexOf('@')

    if (atIndex !== -1) {
      const textAfterAt = textBefore.slice(atIndex + 1)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        openMention(textAfterAt, atIndex)
        return
      }
    }

    closeMention()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionSearch !== null && filtered.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(Math.min(selectedIndex + 1, filtered.length - 1))
          return
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(Math.max(selectedIndex - 1, 0))
          return
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          insertMention(
            filtered[selectedIndex],
            value,
            onChange,
            textareaRef as React.RefObject<HTMLTextAreaElement>,
          )
          return
        case 'Escape':
          e.preventDefault()
          closeMention()
          return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isSubmitting) onSubmit()
    } else if (e.key === 'Escape' && onCancel) {
      onCancel()
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (relatedTarget?.closest('[data-comment-mention-dropdown]')) return
    closeMention()
  }

  return (
    <div className="relative">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={resolvedPlaceholder}
          autoFocus={autoFocus}
          rows={1}
          className="min-h-9 max-h-32 flex-1 resize-none rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm outline-none transition-colors focus:border-primary/30"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || isSubmitting}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition-all hover:bg-violet-500 disabled:opacity-40"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {mentionSearch !== null && filtered.length > 0 && (
        <div
          data-comment-mention-dropdown
          className="absolute left-0 bottom-full mb-1 z-50 w-64 rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden"
        >
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.map((member, i) => (
              <button
                key={member.id}
                type="button"
                data-comment-mention-dropdown
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertMention(
                    member,
                    value,
                    onChange,
                    textareaRef as React.RefObject<HTMLTextAreaElement>,
                  )
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors',
                  i === selectedIndex ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[9px] font-semibold text-violet-600 dark:text-violet-400">
                  {getInitials(member.name)}
                </span>
                <span className="text-xs font-medium text-foreground truncate">{member.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
