'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Timer, Tag } from 'lucide-react'
import {
  checkTimerCategoriesCompliance,
  chooseTimerCategoriesToKeep,
  checkTimerConfigsCompliance,
  chooseTimerConfigsToKeep,
} from '@/api/timer/actions'
import { PlanSelectionDialog } from '@/components/ui/plan-selection-dialog'
import { toast } from 'sonner'

interface TimerCategoriesComplianceInfo {
  overBy: number
  limit: number
  categories: { id: number; name: string; color: string }[]
}

interface TimerConfigsComplianceInfo {
  overBy: number
  limit: number
  configs: { id: number; name: string; categoryColor?: string | null }[]
}

type Step =
  | { kind: 'idle' }
  | { kind: 'categories'; info: TimerCategoriesComplianceInfo }
  | { kind: 'configs'; info: TimerConfigsComplianceInfo }

export function TimerComplianceGate() {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>({ kind: 'idle' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const runConfigsCheck = useCallback(async () => {
    const result = await checkTimerConfigsCompliance()
    if (result && result.configs.length > 0) {
      setStep({ kind: 'configs', info: result })
    } else {
      setStep({ kind: 'idle' })
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await checkTimerCategoriesCompliance()
      if (cancelled) return
      if (result && result.categories.length > 0) {
        setStep({ kind: 'categories', info: result })
      } else {
        await runConfigsCheck()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [runConfigsCheck])

  if (step.kind === 'idle') return null

  if (step.kind === 'categories') {
    const { info } = step
    return (
      <PlanSelectionDialog
        key="categories"
        icon={<Tag className="h-4 w-4 text-violet-500" />}
        title="Choose which timer categories to keep"
        description={
          <>
            Your current plan allows <strong>{info.limit}</strong> timer categor
            {info.limit !== 1 ? 'ies' : 'y'}, but you have{' '}
            <strong>{info.categories.length}</strong>. Choose which ones to keep — the rest will
            be archived, not deleted. Past sessions keep their own name and color, so nothing in
            your history changes.
          </>
        }
        items={info.categories.map((c) => ({ id: c.id, label: c.name, color: c.color }))}
        limit={info.limit}
        isSubmitting={isSubmitting}
        confirmLabel="Confirm selection"
        onConfirm={async (keepIds) => {
          setIsSubmitting(true)
          try {
            const result = await chooseTimerCategoriesToKeep(keepIds)
            if (!result.ok) {
              toast.error('Something went wrong. Please try again.')
              return
            }
            toast.info('Timer categories updated', {
              description: `${info.categories.length - info.limit} categor${info.categories.length - info.limit !== 1 ? 'ies' : 'y'} archived. You can restore them later.`,
            })
            queryClient.invalidateQueries({ queryKey: ['timer-categories'] })
            await runConfigsCheck()
          } catch {
            toast.error('Something went wrong. Please try again.')
          } finally {
            setIsSubmitting(false)
          }
        }}
      />
    )
  }

  const { info } = step
  return (
    <PlanSelectionDialog
      key="configs"
      icon={<Timer className="h-4 w-4 text-violet-500" />}
      title="Choose which timer presets to keep"
      description={
        <>
          Your current plan allows <strong>{info.limit}</strong> timer preset
          {info.limit !== 1 ? 's' : ''}, but you have <strong>{info.configs.length}</strong>.
          Choose which ones to keep — the rest will be archived, not deleted.
        </>
      }
      items={info.configs.map((c) => ({ id: c.id, label: c.name, color: c.categoryColor ?? '#8b5cf6' }))}
      limit={info.limit}
      isSubmitting={isSubmitting}
      confirmLabel="Confirm selection"
      onConfirm={async (keepIds) => {
        setIsSubmitting(true)
        try {
          const result = await chooseTimerConfigsToKeep(keepIds)
          if (!result.ok) {
            toast.error('Something went wrong. Please try again.')
            return
          }
          toast.info('Timer presets updated', {
            description: `${info.configs.length - info.limit} preset${info.configs.length - info.limit !== 1 ? 's' : ''} archived. You can restore them later.`,
          })
          queryClient.invalidateQueries({ queryKey: ['timer-configs'] })
          setStep({ kind: 'idle' })
        } catch {
          toast.error('Something went wrong. Please try again.')
        } finally {
          setIsSubmitting(false)
        }
      }}
    />
  )
}
