'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

export interface MentionSuggestion {
  id: number
  title: string
  listName?: string
  listColor?: string
  isSubtask?: boolean
  parentTitle?: string
}

interface DropdownPos {
  top: number
  left: number
  above: boolean
}

interface UseMentionSearchReturn {
  mentionSearch: string | null
  mentionStart: number
  selectedIndex: number
  setSelectedIndex: (i: number) => void
  dropdownPos: DropdownPos
  filtered: MentionSuggestion[]
  openMention: (search: string, start: number, pos: DropdownPos) => void
  closeMention: () => void
  insertMention: (
    suggestion: MentionSuggestion,
    value: string,
    onChange: (v: string) => void,
    textareaRef: React.RefObject<HTMLTextAreaElement>,
  ) => void
}

export function useMentionSearch(): UseMentionSearchReturn {
  const [mentionSearch, setMentionSearch] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(-1)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [dropdownPos, setDropdownPos] = useState<DropdownPos>({ top: 0, left: 0, above: false })

  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    enabled: mentionSearch !== null,
    staleTime: 30_000,
  })

  const allSuggestions: MentionSuggestion[] = []
  if (data?.docs) {
    for (const task of data.docs) {
      if (task.status === 'deleted') continue
      type ListObj = { name: string; category?: { color?: string | null } | null }
      const list = task.list && typeof task.list === 'object' ? (task.list as ListObj) : null

      allSuggestions.push({
        id: task.id,
        title: task.title,
        listName: list?.name,
        listColor: list?.category?.color ?? '#8b5cf6',
      })

      if (task.subtasks) {
        for (let i = 0; i < task.subtasks.length; i++) {
          allSuggestions.push({
            id: task.id * 10000 + i,
            title: task.subtasks[i].title,
            listName: list?.name,
            listColor: list?.category?.color ?? '#8b5cf6',
            isSubtask: true,
            parentTitle: task.title,
          })
        }
      }
    }
  }

  const filtered =
    mentionSearch !== null
      ? allSuggestions
          .filter(
            (s) =>
              s.title.toLowerCase().includes(mentionSearch.toLowerCase()) ||
              s.parentTitle?.toLowerCase().includes(mentionSearch.toLowerCase()),
          )
          .slice(0, 6)
      : []

  const openMention = useCallback((search: string, start: number, pos: DropdownPos) => {
    setMentionSearch(search)
    setMentionStart(start)
    setDropdownPos(pos)
    setSelectedIndex(0)
  }, [])

  const closeMention = useCallback(() => {
    setMentionSearch(null)
    setMentionStart(-1)
    setSelectedIndex(0)
  }, [])

  const insertMention = useCallback(
    (
      suggestion: MentionSuggestion,
      value: string,
      onChange: (v: string) => void,
      textareaRef: React.RefObject<HTMLTextAreaElement>,
    ) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const cursor = textarea.selectionStart ?? mentionStart + 1
      const before = value.slice(0, mentionStart)
      const after = value.slice(cursor)
      const mention = `@[${suggestion.title}](${suggestion.id})`
      const newValue = before + mention + after

      onChange(newValue)
      closeMention()

      requestAnimationFrame(() => {
        const pos = before.length + mention.length
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
    dropdownPos,
    filtered,
    openMention,
    closeMention,
    insertMention,
  }
}
