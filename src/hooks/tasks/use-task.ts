'use client'

import { useState } from 'react'
import { Task } from '@/payload-types'
import { useToggleTask } from './use-toggle-task'
import { useEditTask } from './use-edit-task'
import { TaskTag } from '@/types/task-tag'
import { RecurrenceDay } from '@/types/recurrence-day'
import { EditSubtask } from '@/types/edit-subtask'

type EditDraft = {
  title?: string
  description?: string
  tags?: Task['tags']
  customTags?: { tagId: string }[]
  dueDate?: string | null
  type?: Task['type']
  recurrence?: Task['recurrence']
  subtasks?: { title: string; done: boolean }[]
}

export const useTask = () => {
  const [editingId, setEditingId] = useState<number | undefined>(undefined)
  const [draft, setDraft] = useState({ title: '', description: '' })
  const [editTags, setEditTags] = useState<TaskTag[]>([])
  const [editCustomTags, setEditCustomTags] = useState<string[]>([])
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined)
  const [editType, setEditType] = useState<Task['type']>('simple')
  const [editFrequency, setEditFrequency] = useState<'daily' | 'custom'>('daily')
  const [editDays, setEditDays] = useState<RecurrenceDay[]>([])
  const [editSubtasks, setEditSubtasks] = useState<EditSubtask[]>([])
  const [subtaskInput, setSubtaskInput] = useState('')
  const [expandedSubtask, setExpandedSubtask] = useState<number | null>(null)
  const [expandedViewSubtask, setExpandedViewSubtask] = useState<number | null>(null)
  const [showNewTag, setShowNewTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#8b5cf6')

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

  const saveEdit = async (id: number, extraFields?: Omit<EditDraft, 'title' | 'description'>) => {
    if (editingId !== id) return
    try {
      await editMutation.mutateAsync({
        id,
        draft: {
          ...draft,
          ...extraFields,
        },
      })
      stopEditing()
      return true
    } catch {
      return false
    }
  }

  const toggleStatus = (id: number, currentStatus: 'active' | 'completed') => {
    toggleMutation.mutate({ id, status: currentStatus })
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
    editTags,
    setEditTags,
    editCustomTags,
    setEditCustomTags,
    editDays,
    setEditDays,
    editDueDate,
    setEditDueDate,
    editType,
    setEditType,
    editFrequency,
    setEditFrequency,
    editSubtasks,
    setEditSubtasks,
    subtaskInput,
    setSubtaskInput,
    expandedSubtask,
    setExpandedSubtask,
    expandedViewSubtask,
    setExpandedViewSubtask,
    showNewTag,
    setShowNewTag,
    newTagName,
    setNewTagName,
    newTagColor,
    setNewTagColor,
  }
}
