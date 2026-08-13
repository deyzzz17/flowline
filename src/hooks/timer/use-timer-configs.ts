'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { SessionConfig } from '@/hooks/timer/use-timer'
import { toast } from 'sonner'
import { usePlanLimits } from '@/hooks/plan/use-plan-limits'
import { useRestorePrompt } from '@/components/ui/restore-prompt-context'
import { listPlanArchivedTimerConfigs, restoreArchivedTimerConfig } from '@/api/timer/actions'
import {
  LIMIT_ERRORS,
  SAFETY_CAP_ERRORS,
  isPlanUnlimited,
  type LimitError,
  type SafetyCapError,
} from '@/lib/plan-limits'

const FALLBACK_TIMER_PRESETS_LIMIT = 10

export interface TimerConfigItem {
  id: number
  name: string
  sessionDuration: number
  workDuration: number
  breakDuration: number
  categoryName?: string
  categoryColor?: string
  subCategory?: string
  subCategoryColor?: string
}

function formatSeconds(s: number): string {
  if (!s || s === 0) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

export function buildConfigName(config: Omit<TimerConfigItem, 'id' | 'name'>): string {
  const parts: string[] = []
  if (config.categoryName) parts.push(config.categoryName)
  if (config.subCategory) parts.push(config.subCategory)
  if (config.sessionDuration) parts.push(formatSeconds(config.sessionDuration))
  if (parts.length === 0) return 'Free session'
  return parts.join(' · ')
}

export function configToSessionConfig(c: TimerConfigItem): SessionConfig {
  return {
    sessionDuration: c.sessionDuration ?? 0,
    workDuration: c.workDuration ?? 0,
    breakDuration: c.breakDuration ?? 0,
    categoryName: c.categoryName,
    categoryColor: c.categoryColor,
    subCategory: c.subCategory,
    subCategoryColor: c.subCategoryColor,
  }
}

function isDuplicate(
  existing: TimerConfigItem[],
  candidate: Omit<TimerConfigItem, 'id' | 'name'>,
): boolean {
  return existing.some(
    (c) =>
      (c.sessionDuration ?? 0) === (candidate.sessionDuration ?? 0) &&
      (c.workDuration ?? 0) === (candidate.workDuration ?? 0) &&
      (c.breakDuration ?? 0) === (candidate.breakDuration ?? 0) &&
      (c.categoryName ?? '') === (candidate.categoryName ?? '') &&
      (c.subCategory ?? '') === (candidate.subCategory ?? ''),
  )
}

export const useTimerConfigs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [limitError, setLimitError] = useState<LimitError | null>(null)
  const [capError, setCapError] = useState<SafetyCapError | null>(null)
  const queryClient = useQueryClient()
  const planLimits = usePlanLimits()
  const { openPrompt } = useRestorePrompt()

  const { data, isLoading } = useQuery({
    queryKey: ['timer-configs'],
    queryFn: () => api.timer.configs.list(),
    staleTime: 60_000,
  })

  const configs: TimerConfigItem[] = (data?.docs ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    sessionDuration: c.sessionDuration ?? 0,
    workDuration: c.workDuration ?? 0,
    breakDuration: c.breakDuration ?? 0,
    categoryName: c.categoryName ?? undefined,
    categoryColor: c.categoryColor ?? undefined,
    subCategory: c.subCategory ?? undefined,
  }))

  const saveMutation = useMutation({
    mutationFn: (data: Omit<TimerConfigItem, 'id'>) => api.timer.configs.save(data),
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: ['timer-configs'] })
      const previous = queryClient.getQueryData(['timer-configs'])
      queryClient.setQueryData(['timer-configs'], (old: any) => ({
        ...old,
        docs: [{ id: Date.now(), ...newConfig }, ...(old?.docs ?? [])],
      }))
      return { previous }
    },
    onSuccess: (response, _vars, context) => {
      if (!response.ok) {
        queryClient.setQueryData(['timer-configs'], context?.previous)

        if (response.error === LIMIT_ERRORS.TIMER_PRESETS_LIMIT) {
          setLimitError(LIMIT_ERRORS.TIMER_PRESETS_LIMIT)
        } else if (response.error === SAFETY_CAP_ERRORS.TIMER_PRESETS_CAP) {
          setCapError(SAFETY_CAP_ERRORS.TIMER_PRESETS_CAP)
        }
        return
      }
      queryClient.invalidateQueries({ queryKey: ['timer-configs'] })
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['timer-configs'], context?.previous)
      toast.error('Failed to save config')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.timer.configs.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['timer-configs'] })
      const previous = queryClient.getQueryData(['timer-configs'])
      queryClient.setQueryData(['timer-configs'], (old: any) => ({
        ...old,
        docs: (old?.docs ?? []).filter((c: any) => c.id !== id),
      }))
      return { previous }
    },
    onSuccess: async (response) => {
      if (!response.ok) return

      const archived = (await listPlanArchivedTimerConfigs()).docs
      if (archived.length === 0) return

      const presetsLimit = planLimits?.limits.timerPresets ?? FALLBACK_TIMER_PRESETS_LIMIT
      const activeCount =
        queryClient.getQueryData<{ docs: unknown[] }>(['timer-configs'])?.docs.length ?? 0
      const room =
        planLimits && isPlanUnlimited(planLimits.plan, 'timerPresets')
          ? archived.length
          : Math.max(0, presetsLimit - activeCount)

      if (room <= 0) return

      openPrompt({
        title: 'Restore an archived preset?',
        description:
          'You have timer presets that were archived when your plan changed. Restore some now that you have room.',
        items: archived.map((c) => ({ id: c.id, label: c.name, color: c.categoryColor ?? '#8b5cf6' })),
        maxSelectable: room,
        onConfirm: async (ids) => {
          const results = await Promise.all(ids.map((id) => restoreArchivedTimerConfig(id)))
          const allOk = results.every((r) => r.ok)

          queryClient.invalidateQueries({ queryKey: ['timer-configs'] })

          if (allOk) {
            toast.info(ids.length > 1 ? 'Presets restored' : 'Preset restored')
          } else {
            toast.error('Some presets could not be restored', { description: 'Please try again.' })
          }

          return { ok: allOk }
        },
      })
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['timer-configs'], context?.previous)
      toast.error('Failed to delete config')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-configs'] })
    },
  })

  const saveConfig = (sessionConfig: SessionConfig) => {
    const configData = {
      name: buildConfigName({
        sessionDuration: sessionConfig.sessionDuration,
        workDuration: sessionConfig.workDuration,
        breakDuration: sessionConfig.breakDuration,
        categoryName: sessionConfig.categoryName,
        categoryColor: sessionConfig.categoryColor,
        subCategory: sessionConfig.subCategory,
        subCategoryColor: sessionConfig.subCategoryColor,
      }),
      sessionDuration: sessionConfig.sessionDuration,
      workDuration: sessionConfig.workDuration,
      breakDuration: sessionConfig.breakDuration,
      categoryName: sessionConfig.categoryName,
      categoryColor: sessionConfig.categoryColor,
      subCategory: sessionConfig.subCategory,
      subCategoryColor: sessionConfig.subCategoryColor,
    }

    if (isDuplicate(configs, configData)) return

    saveMutation.mutate(configData)
  }

  return {
    sidebarOpen,
    setSidebarOpen,
    configs,
    isLoading,
    saveConfig,
    deleteMutation,
    limitError,
    clearLimitError: () => setLimitError(null),
    capError,
    clearCapError: () => setCapError(null),
  }
}
