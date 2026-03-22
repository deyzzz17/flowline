'use client'

import { useState } from 'react'
import { useCreateTask } from './use-create-task'

export const useTaskCreation = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showError, setShowError] = useState(false)

  const createTask = useCreateTask()

  const isInvalid = title.trim() === ''

  const handleSetTitle = (value: string) => {
    setTitle(value)
    if (showError) setShowError(false)
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setShowError(false)
  }

  const saveTask = async () => {
    if (title.trim() === '') {
      setShowError(true)
      return false
    }
    try {
      await createTask.mutateAsync({ title, description })
      resetForm()
      return true
    } catch {
      return false
    }
  }

  return {
    title,
    description,
    isInvalid,
    setTitle: handleSetTitle,
    setDescription,
    resetForm,
    showError,
    isLoading: createTask.isPending,
    saveTask,
  }
}
