import { api } from '@/api'
import { useState } from 'react'

export const useTaskCreation = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showError, setShowError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isInvalid = title.trim() === ''

  const handleSetTitle = (value: string) => {
    setTitle(value)
    if (showError) {
      setShowError(false)
    }
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
    setIsLoading(true)
    const result = await api.tasks.create({ title, description })
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
    isInvalid,
    setTitle: handleSetTitle,
    setDescription,
    resetForm,
    showError,
    isLoading,
    saveTask,
  }
}
