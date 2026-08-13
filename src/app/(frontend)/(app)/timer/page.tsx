import { TimerPageClient } from '@/components/timer/timer-page-client'
import { TimerComplianceGate } from '@/components/timer/timer-compliance-gate'
import { requireAuth } from '@/lib/require-auth'

export default async function TimerPage() {
  await requireAuth()

  return (
    <>
      <TimerComplianceGate />
      <TimerPageClient />
    </>
  )
}
