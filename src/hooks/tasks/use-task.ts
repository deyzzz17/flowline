'use client'

import { api } from '@/api'
import { Task } from '@/payload-types'
import { useState } from 'react'

export const useTask = () => {
  const [editingId, setEditingId] = useState<number | undefined>(undefined)
  const [isUpdating, setIsUpdating] = useState(false)
  const [draft, setDraft] = useState({ title: '', description: '' })

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
    setIsUpdating(true)
    const result = await api.tasks.edit(id, draft)
    setIsUpdating(false)
    return result.ok
  }

  const toggleStatus = async (id: number, currentStatus: 'active' | 'completed') => {
    setIsUpdating(true)
    const result = await api.tasks.toggleStatus(id, currentStatus)
    setIsUpdating(false)
    return result.ok
  }

  return {
    toggleStatus,
    isUpdating,
    editingId,
    startEditing,
    stopEditing,
    updateDraft,
    saveEdit,
    draft,
  }
}
