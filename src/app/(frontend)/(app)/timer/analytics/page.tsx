import { AnalyticsClient } from '@/components/timer/analytics/analytics-client'
import { ProtectedRoute } from '@/components/route/protected-route'

export default function TimerAnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsClient />
    </ProtectedRoute>
  )
}
