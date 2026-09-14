'use client'

import { useRouter } from 'next/navigation'
import { TimerCustomizeDialog } from './timer-customize-dialog'
import { useTimerContext } from './timer-context'
import { useTimerConfigs } from '@/hooks/timer/use-timer-configs'
import { PlanLimitDialog } from '../ui/plan-limit-dialog'
import { SafetyCapDialog } from '../ui/safety-cap-dialog'
import type { SessionConfig } from '@/hooks/timer/use-timer'

// Mounted once, globally, alongside TimerProvider — not just on /timer — so
// the "start timer for this task" icon on a task card can open this same
// dialog from any page. Starting a session here also navigates to /timer,
// matching what happens when you start one from the timer page itself.
export function GlobalTimerDialog() {
  const router = useRouter()
  const { customizeOpen, setCustomizeOpen, startWithConfig, pendingTaskId, setPendingTaskId } =
    useTimerContext()
  const { saveConfig, limitError, clearLimitError, capError, clearCapError } = useTimerConfigs()

  const handleOpenChange = (v: boolean) => {
    setCustomizeOpen(v)
    if (!v) setPendingTaskId(null)
  }

  const handleStart = (config: SessionConfig) => {
    setCustomizeOpen(false)
    setPendingTaskId(null)
    saveConfig(config)
    startWithConfig(config)
    router.push('/timer')
  }

  return (
    <>
      <TimerCustomizeDialog
        open={customizeOpen}
        onOpenChange={handleOpenChange}
        onStart={handleStart}
        initialTaskId={pendingTaskId}
      />
      <PlanLimitDialog
        open={!!limitError}
        onOpenChange={(v) => {
          if (!v) clearLimitError()
        }}
        limitError={limitError}
      />
      <SafetyCapDialog
        open={!!capError}
        onOpenChange={(v) => {
          if (!v) clearCapError()
        }}
        capError={capError}
      />
    </>
  )
}
