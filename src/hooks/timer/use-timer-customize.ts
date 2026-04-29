'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timerAPI } from '@/api/timer'
import { toast } from 'sonner'

export interface TimerSession {
  sessionDuration: number | ''
  workDuration: number | ''
  breakDuration: number | ''
  categoryId: string
  subCategory: string
  taskId: number | null
}

function toSeconds(val: number | ''): number {
  return val === '' ? 0 : Number(val)
}

export const useTimerCustomize = () => {
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#8b5cf6')

  const [session, setSession] = useState<TimerSession>({
    sessionDuration: '',
    workDuration: '',
    breakDuration: '',
    categoryId: '',
    subCategory: '',
    taskId: null,
  })

  const queryClient = useQueryClient()

  const { data: categoriesData } = useQuery({
    queryKey: ['timer-categories'],
    queryFn: () => timerAPI.categories.list(),
    staleTime: 60_000,
  })
  const categories = categoriesData?.docs ?? []

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => timerAPI.categories.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timer-categories'] }),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => timerAPI.categories.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timer-categories'] }),
  })

  const update = (field: keyof TimerSession, value: TimerSession[keyof TimerSession]) => {
    setSession((prev) => ({ ...prev, [field]: value }))
  }

  const sessionSecs = toSeconds(session.sessionDuration)
  const workSecs = toSeconds(session.workDuration)
  const breakSecs = toSeconds(session.breakDuration)

  const workExceedsSession = workSecs > 0 && sessionSecs > 0 && workSecs > sessionSecs
  const breakExceedsSession = breakSecs > 0 && sessionSecs > 0 && breakSecs > sessionSecs
  const breakRequired = workSecs > 0 && sessionSecs > 0 && workSecs < sessionSecs
  const breakMissing = breakRequired && breakSecs === 0
  const subCategoryWithoutCategory = session.subCategory.trim() !== '' && session.categoryId === ''

  const isValid =
    !workExceedsSession &&
    !breakExceedsSession &&
    !breakMissing &&
    !subCategoryWithoutCategory

  const isFreeMode = sessionSecs === 0 && workSecs === 0 && breakSecs === 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (workExceedsSession) {
      toast.error('Duration conflict', {
        description: 'Work duration cannot exceed the total session duration.',
      })
      return
    }
    if (breakExceedsSession) {
      toast.error('Duration conflict', {
        description: 'Break duration cannot exceed the total session duration.',
      })
      return
    }
    if (breakMissing) {
      toast.error('Break required', {
        description: 'A break duration is required when work time is shorter than the session.',
      })
      return
    }
    if (subCategoryWithoutCategory) {
      toast.error('Category required', {
        description: 'Please select a category before adding a sub-category.',
      })
      return
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    await createCategoryMutation.mutateAsync({
      name: newCategoryName.trim(),
      color: newCategoryColor,
    })
    setNewCategoryName('')
    setNewCategoryColor('#8b5cf6')
    setShowNewCategory(false)
  }

  const reset = () => {
    setSession({
      sessionDuration: '',
      workDuration: '',
      breakDuration: '',
      categoryId: '',
      subCategory: '',
      taskId: null,
    })
    setShowNewCategory(false)
    setNewCategoryName('')
    setNewCategoryColor('#8b5cf6')
    setAnalyticsOpen(false)
  }

  return {
    session,
    update,
    analyticsOpen,
    setAnalyticsOpen,
    categories,
    showNewCategory,
    setShowNewCategory,
    newCategoryName,
    setNewCategoryName,
    newCategoryColor,
    setNewCategoryColor,
    handleCreateCategory,
    handleSubmit,
    deleteCategoryMutation,
    isValid,
    isFreeMode,
    breakRequired,
    workExceedsSession,
    breakExceedsSession,
    createCategoryMutation,
    reset,
  }
}