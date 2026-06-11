'use client'

import { useState } from 'react'
import { sendFeedbackEmail } from '@/api/support/actions'
import { toast } from 'sonner'

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
      const result = await sendFeedbackEmail({ subject: subject.trim(), message: message.trim() })

      if ('error' in result) {
        setError(result.error ?? 'Something went wrong. Please try again.')
        return
      }

      toast.success('Feedback sent — thank you!')
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
