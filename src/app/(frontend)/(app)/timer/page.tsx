import { TimerPageClient } from '@/components/timer/timer-page-client'
import { requireAuth } from '@/lib/require-auth'

export default async function TimerPage() {
  await requireAuth()

  return <TimerPageClient />
}
