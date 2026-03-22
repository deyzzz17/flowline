'use client'

import { useState } from 'react'
import { Task } from '@/payload-types'
import { useToggleTask } from './use-toggle-task'
import { useEditTask } from './use-edit-task'

export const useTask = () => {
  const [editingId, setEditingId] = useState<number | undefined>(undefined)
  const [draft, setDraft] = useState({ title: '', description: '' })

  const toggleMutation = useToggleTask()
  const editMutation = useEditTask()

  const startEditing = (task: Task) => {
    setEditingId(task.id)
    setDraft({
      title: task.title,
      description: task.description ?? '',
    })
  }

  const stopEditing = () => {
    setEditingId(undefined)
    setDraft({ title: '', description: '' })
  }

  const updateDraft = (updates: Partial<{ title: string; description: string }>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
  }

  const saveEdit = async (id: number) => {
    if (editingId !== id) return
    try {
      await editMutation.mutateAsync({ id, draft })
      stopEditing()
      return true
    } catch {
      return false
    }
  }

  const toggleStatus = async (id: number, currentStatus: 'active' | 'completed') => {
    try {
      await toggleMutation.mutateAsync({ id, status: currentStatus })
      return true
    } catch {
      return false
    }
  }

  return {
    toggleStatus,
    isUpdating: toggleMutation.isPending || editMutation.isPending,
    editingId,
    startEditing,
    stopEditing,
    updateDraft,
    saveEdit,
    draft,
  }
}
