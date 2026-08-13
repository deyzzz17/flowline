'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import {
  checkCalendarCategoriesCompliance,
  chooseCalendarCategoriesToKeep,
} from '@/api/calendar/actions'
import { PlanSelectionDialog } from '@/components/ui/plan-selection-dialog'
import { toast } from 'sonner'

interface CalendarCategoryInfo {
  overBy: number
  limit: number
  categories: { id: number; name: string; color: string }[]
}

export function CalendarCategoriesComplianceGate() {
  const queryClient = useQueryClient()
  const [compliance, setCompliance] = useState<CalendarCategoryInfo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await checkCalendarCategoriesCompliance()
      if (!cancelled) setCompliance(result)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!compliance) return null

  return (
    <PlanSelectionDialog
      icon={<CalendarDays className="h-4 w-4 text-violet-500" />}
      title="Choose which calendar categories to keep"
      description={
        <>
          Your current plan allows <strong>{compliance.limit}</strong> calendar categor
          {compliance.limit !== 1 ? 'ies' : 'y'}, but you have{' '}
          <strong>{compliance.categories.length}</strong>. Choose which ones to keep — the rest
          will be archived, not deleted. Events already using an archived category keep it; you
          just won&apos;t be able to assign it to new events until it&apos;s restored.
        </>
      }
      items={compliance.categories.map((c) => ({ id: c.id, label: c.name, color: c.color }))}
      limit={compliance.limit}
      isSubmitting={isSubmitting}
      confirmLabel="Confirm selection"
      onConfirm={async (keepIds) => {
        setIsSubmitting(true)
        try {
          const result = await chooseCalendarCategoriesToKeep(keepIds)
          if (!result.ok) {
            toast.error('Something went wrong. Please try again.')
            return
          }
          toast.info('Calendar categories updated', {
            description: `${compliance.categories.length - compliance.limit} categor${compliance.categories.length - compliance.limit !== 1 ? 'ies' : 'y'} archived. You can restore them later.`,
          })
          queryClient.invalidateQueries({ queryKey: ['calendar-categories'] })
          setCompliance(null)
        } catch {
          toast.error('Something went wrong. Please try again.')
        } finally {
          setIsSubmitting(false)
        }
      }}
    />
  )
}
