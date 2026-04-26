'use client'

import { useState } from 'react'

export type FeedbackCategory = 'bug' | 'suggestion' | 'other'

export const useFeedback = () => {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = subject.trim().length > 0 && message.trim().length > 0

  const reset = () => {
    setSubject('')
    setMessage('')
    setError(null)
  }

  const handleOpen = () => {
    reset()
    setOpen(true)
  }

  const handleClose = () => {
    reset()
    setOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800)) // simulé pour l'instant
      handleClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    open,
    setOpen,
    subject,
    setSubject,
    message,
    setMessage,
    isLoading,
    error,
    isValid,
    handleOpen,
    handleClose,
    handleSubmit,
  }
}
