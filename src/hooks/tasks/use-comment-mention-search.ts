'use client'

import { useState, useCallback } from 'react'
import type { ContactProfile } from '@/api/contacts/actions'

interface UseCommentMentionSearchReturn {
  mentionSearch: string | null
  mentionStart: number
  selectedIndex: number
  setSelectedIndex: (i: number) => void
  filtered: ContactProfile[]
  openMention: (search: string, start: number) => void
  closeMention: () => void
  insertMention: (
    member: ContactProfile,
    value: string,
    onChange: (v: string) => void,
    textareaRef: React.RefObject<HTMLTextAreaElement>,
  ) => void
}

export function useCommentMentionSearch(members: ContactProfile[]): UseCommentMentionSearchReturn {
  const [mentionSearch, setMentionSearch] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(-1)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered =
    mentionSearch !== null
      ? members.filter((m) => m.name.toLowerCase().includes(mentionSearch.toLowerCase())).slice(0, 6)
      : []

  const openMention = useCallback((search: string, start: number) => {
    setMentionSearch(search)
    setMentionStart(start)
    setSelectedIndex(0)
  }, [])

  const closeMention = useCallback(() => {
    setMentionSearch(null)
    setMentionStart(-1)
    setSelectedIndex(0)
  }, [])

  const insertMention = useCallback(
    (
      member: ContactProfile,
      value: string,
      onChange: (v: string) => void,
      textareaRef: React.RefObject<HTMLTextAreaElement>,
    ) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const cursor = textarea.selectionStart ?? mentionStart + 1
      const before = value.slice(0, mentionStart)
      const after = value.slice(cursor)
      const mention = `@[${member.name}](${member.id})`
      const newValue = before + mention + ' ' + after

      onChange(newValue)
      closeMention()

      requestAnimationFrame(() => {
        const pos = before.length + mention.length + 1
        textarea.setSelectionRange(pos, pos)
        textarea.focus()
      })
    },
    [mentionStart, closeMention],
  )

  return {
    mentionSearch,
    mentionStart,
    selectedIndex,
    setSelectedIndex,
    filtered,
    openMention,
    closeMention,
    insertMention,
  }
}
