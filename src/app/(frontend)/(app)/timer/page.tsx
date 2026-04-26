import { TimerPageClient } from '@/components/timer/timer-page-client'
import { ProtectedRoute } from '@/components/route/protected-route'

export default function TimerPage() {
  return (
    <ProtectedRoute>
      <TimerPageClient />
    </ProtectedRoute>
  )
}
