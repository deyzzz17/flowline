'use client'

import { useState } from 'react'
import { api } from '@/api'
import type { Task } from '@/payload-types'

type TaskType = NonNullable<Task['type']>
type TaskTag = NonNullable<Task['tags']>[number]
type RecurrenceFrequency = NonNullable<Task['recurrence']>['frequency']
type RecurrenceDay = NonNullable<NonNullable<Task['recurrence']>['days']>[number]

export const useTaskCreation = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('simple')
  const [tags, setTags] = useState<TaskTag[]>([])
  const [subtasks, setSubtasks] = useState<{ title: string; done: boolean }[]>([])
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily')
  const [days, setDays] = useState<RecurrenceDay[]>([])
  const [showError, setShowError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isInvalid = title.trim() === ''

  const handleSetTitle = (value: string) => {
    setTitle(value)
    if (showError) setShowError(false)
  }

  const toggleTag = (tag: TaskTag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const toggleDay = (day: RecurrenceDay) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const addSubtask = (subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return
    setSubtasks((prev) => [...prev, { title: subtaskTitle.trim(), done: false }])
  }

  const removeSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setType('simple')
    setTags([])
    setSubtasks([])
    setFrequency('daily')
    setDays([])
    setShowError(false)
  }

  const saveTask = async () => {
    if (title.trim() === '') {
      setShowError(true)
      return false
    }

    setIsLoading(true)
    const result = await api.tasks.create({
      title,
      description,
      type,
      tags,
      subtasks,
      ...(type === 'recurring' && {
        recurrence: {
          frequency,
          ...(frequency === 'custom' && { days }),
        },
      }),
    })
    setIsLoading(false)

    if (result.ok) {
      resetForm()
      return true
    }
    return false
  }

  return {
    title,
    description,
    setTitle: handleSetTitle,
    setDescription,
    showError,
    isLoading,
    isInvalid,
    type,
    setType,
    tags,
    toggleTag,
    subtasks,
    addSubtask,
    removeSubtask,
    frequency,
    setFrequency,
    days,
    toggleDay,
    saveTask,
    resetForm,
  }
}
