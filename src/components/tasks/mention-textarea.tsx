'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { useMentionSearch } from '@/hooks/tasks/use-mention-search'

export function parseMentions(
  text: string,
): Array<{ type: 'text' | 'mention'; content: string; taskId?: number }> {
  const parts: Array<{ type: 'text' | 'mention'; content: string; taskId?: number }> = []
  const regex = /@\[([^\]]+)\]\((\d+)\)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'mention', content: match[1], taskId: parseInt(match[2]) })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts
}

function getCaretPosition(
  textarea: HTMLTextAreaElement,
  atIndex: number,
): { top: number; left: number; above: boolean } {
  const textareaRect = textarea.getBoundingClientRect()
  const style = window.getComputedStyle(textarea)

  const mirror = document.createElement('div')
  mirror.style.cssText = `
    position: fixed;
    top: ${textareaRect.top}px;
    left: ${textareaRect.left}px;
    width: ${textareaRect.width}px;
    height: ${textareaRect.height}px;
    visibility: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: hidden;
    font: ${style.font};
    padding: ${style.padding};
    border: ${style.border};
    line-height: ${style.lineHeight};
    box-sizing: border-box;
  `

  mirror.textContent = textarea.value.slice(0, atIndex)
  const span = document.createElement('span')
  span.textContent = '@'
  mirror.appendChild(span)
  document.body.appendChild(mirror)

  const spanRect = span.getBoundingClientRect()
  document.body.removeChild(mirror)

  const dropdownHeight = 250
  const spaceBelow = window.innerHeight - spanRect.bottom
  const above = spaceBelow < dropdownHeight

  return {
    top: above ? spanRect.top - dropdownHeight - 4 : spanRect.bottom + 4,
    left: Math.max(8, Math.min(spanRect.left, window.innerWidth - 268)),
    above,
  }
}

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export const MentionTextarea = ({
  value,
  onChange,
  placeholder,
  className,
  minHeight = 'min-h-[80px]',
}: MentionTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    mentionSearch,
    selectedIndex,
    setSelectedIndex,
    dropdownPos,
    filtered,
    openMention,
    closeMention,
    insertMention,
  } = useMentionSearch()

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursor = e.target.selectionStart ?? 0
    onChange(newValue)

    const textBefore = newValue.slice(0, cursor)
    const atIndex = textBefore.lastIndexOf('@')

    if (atIndex !== -1) {
      const textAfterAt = textBefore.slice(atIndex + 1)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        const pos = getCaretPosition(e.target, atIndex)
        openMention(textAfterAt, atIndex, pos)
        return
      }
    }

    closeMention()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionSearch === null || filtered.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(Math.min(selectedIndex + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(Math.max(selectedIndex - 1, 0))
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (filtered[selectedIndex])
          insertMention(
            filtered[selectedIndex],
            value,
            onChange,
            textareaRef as React.RefObject<HTMLTextAreaElement>,
          )
        break
      case 'Escape':
        e.preventDefault()
        closeMention()
        break
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (relatedTarget?.closest('[data-mention-dropdown]')) return
    closeMention()
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          'w-full bg-muted/30 p-3 rounded-xl text-sm outline-none resize-none border border-border/40 focus:border-primary/30 transition-colors',
          minHeight,
          className,
        )}
      />

      {mentionSearch !== null && filtered.length > 0 && (
        <div
          data-mention-dropdown
          className="fixed z-200 w-64 rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="px-3 py-1.5 border-b border-border/40">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Mention a task
            </p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((suggestion, i) => (
              <button
                key={suggestion.id}
                type="button"
                data-mention-dropdown
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertMention(
                    suggestion,
                    value,
                    onChange,
                    textareaRef as React.RefObject<HTMLTextAreaElement>,
                  )
                }}
                className={cn(
                  'flex w-full items-start gap-2 px-3 py-2 text-left transition-colors',
                  i === selectedIndex ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {suggestion.isSubtask && (
                      <span className="text-muted-foreground/50 mr-1">↳</span>
                    )}
                    {suggestion.title}
                  </p>
                  {(suggestion.listName || suggestion.parentTitle) && (
                    <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
                      {suggestion.isSubtask && suggestion.parentTitle
                        ? `${suggestion.parentTitle} · ${suggestion.listName ?? ''}`
                        : suggestion.listName}
                    </p>
                  )}
                </div>
                {suggestion.listColor && (
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: suggestion.listColor }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground/50">
              ↑↓ naviguer · Enter sélectionner · Esc fermer
            </p>
          </div>
        </div>
      )}

      {mentionSearch !== null && filtered.length === 0 && mentionSearch.length > 0 && (
        <div
          data-mention-dropdown
          className="fixed z-200 w-56 rounded-xl border border-border/60 bg-popover shadow-lg px-3 py-2.5"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <p className="text-xs text-muted-foreground">
            No tasks found for &quot;{mentionSearch}&quot;
          </p>
        </div>
      )}
    </div>
  )
}
