'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timerAPI } from '@/api/timer'
import { toast } from 'sonner'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import { useRestorePrompt } from '@/components/ui/restore-prompt-context'
import {
  listPlanArchivedTimerCategories,
  restoreArchivedTimerCategory,
} from '@/api/timer/actions'
import {
  LIMIT_ERRORS,
  SAFETY_CAP_ERRORS,
  isPlanUnlimited,
  type LimitError,
  type SafetyCapError,
} from '@/lib/plan-limits'

const FALLBACK_TIMER_CATEGORIES_LIMIT = 10

export interface TimerSession {
  sessionDuration: number | ''
  workDuration: number | ''
  breakDuration: number | ''
  categoryId: string
  subCategory: string
  subCategoryColor: string
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
  const [limitError, setLimitError] = useState<LimitError | null>(null)
  const [capError, setCapError] = useState<SafetyCapError | null>(null)

  const [session, setSession] = useState<TimerSession>({
    sessionDuration: '',
    workDuration: '',
    breakDuration: '',
    categoryId: '',
    subCategory: '',
    subCategoryColor: '#8b5cf6',
    taskId: null,
  })

  const queryClient = useQueryClient()
  const planLimits = usePlanLimits()
  const { openPrompt } = useRestorePrompt()

  const { data: categoriesData } = useQuery({
    queryKey: ['timer-categories'],
    queryFn: () => timerAPI.categories.list(),
    staleTime: 60_000,
  })
  const categories = categoriesData?.docs ?? []

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => timerAPI.categories.create(data),
    onSuccess: (response) => {
      if (!response.ok) {
        if (response.error === LIMIT_ERRORS.TIMER_CATEGORIES_LIMIT) {
          setLimitError(LIMIT_ERRORS.TIMER_CATEGORIES_LIMIT)
        } else if (response.error === SAFETY_CAP_ERRORS.TIMER_CATEGORIES_CAP) {
          setCapError(SAFETY_CAP_ERRORS.TIMER_CATEGORIES_CAP)
        }
        return
      }
      queryClient.invalidateQueries({ queryKey: ['timer-categories'] })
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => timerAPI.categories.delete(id),
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['timer-categories'] })
      if (!response.ok) return

      const archived = (await listPlanArchivedTimerCategories()).docs
      if (archived.length === 0) return

      const categoriesLimit = planLimits?.limits.timerCategories ?? FALLBACK_TIMER_CATEGORIES_LIMIT
      const nonDefaultCount = categories.filter((c) => !c.isDefault).length
      const activeCount = Math.max(0, nonDefaultCount - 1)
      const room =
        planLimits && isPlanUnlimited(planLimits.plan, 'timerCategories')
          ? archived.length
          : Math.max(0, categoriesLimit - activeCount)

      if (room <= 0) return

      openPrompt({
        title: 'Restore an archived timer category?',
        description:
          'You have timer categories that were archived when your plan changed. Restore some now that you have room.',
        items: archived.map((c) => ({ id: c.id, label: c.name, color: c.color })),
        maxSelectable: room,
        onConfirm: async (ids) => {
          const results = await Promise.all(ids.map((id) => restoreArchivedTimerCategory(id)))
          const allOk = results.every((r) => r.ok)

          queryClient.invalidateQueries({ queryKey: ['timer-categories'] })

          if (allOk) {
            toast.info(ids.length > 1 ? 'Timer categories restored' : 'Timer category restored')
          } else {
            toast.error('Some timer categories could not be restored', {
              description: 'Please try again.',
            })
          }

          return { ok: allOk }
        },
      })
    },
  })

  const update = (field: keyof TimerSession, value: TimerSession[keyof TimerSession]) => {
    setSession((prev) => ({ ...prev, [field]: value }))
  }

  const sessionSecs = toSeconds(session.sessionDuration)
  const workSecs = toSeconds(session.workDuration)
  const breakSecs = toSeconds(session.breakDuration)

  const hasSession = sessionSecs > 0

  const workExceedsSession = workSecs > 0 && hasSession && workSecs > sessionSecs
  const breakExceedsSession = breakSecs > 0 && hasSession && breakSecs > sessionSecs

  const breakRequired = workSecs > 0 && hasSession && workSecs < sessionSecs
  const breakMissing = breakRequired && breakSecs === 0

  const subCategoryWithoutCategory = session.subCategory.trim() !== '' && session.categoryId === ''

  const isFreeWithIntervals = !hasSession && (workSecs > 0 || breakSecs > 0)

  const isFreeMode = sessionSecs === 0 && workSecs === 0 && breakSecs === 0

  const isValid =
    !workExceedsSession && !breakExceedsSession && !breakMissing && !subCategoryWithoutCategory

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
    const result = await createCategoryMutation.mutateAsync({
      name: newCategoryName.trim(),
      color: newCategoryColor,
    })
    if (!result.ok) return
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
      subCategoryColor: '#8b5cf6',
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
    isFreeWithIntervals,
    breakRequired,
    workExceedsSession,
    breakExceedsSession,
    createCategoryMutation,
    reset,
    limitError,
    clearLimitError: () => setLimitError(null),
    capError,
    clearCapError: () => setCapError(null),
  }
}
